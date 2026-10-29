using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Notifications;

/// <summary>
/// The caller's own notification preferences (L2-111, ADR 0069): the kinds their role receives whose modules are on, each on unless they
/// turned it off. Saving refuses a kind the role never receives with 422 and a kind whose module is off with 404 (L2-121), keeps the rows of kinds no longer offered, and is audited.
/// </summary>
public sealed class NotificationPreferencesHandler(IPromiseHubDb db, ITenantContext tenant, NotificationKinds kinds, IAuditWriter audit)
{
    public async Task<NotificationPreferencesDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var offered = await kinds.OfferedAsync(tenant.Role, cancellationToken);
        var mine = await db.NotificationPreferences.AsNoTracking().Where(p => p.MembershipId == tenant.MembershipId)
            .ToDictionaryAsync(p => p.Kind, p => p.InApp, cancellationToken);
        return new NotificationPreferencesDto([.. offered.Select(k => new NotificationPreferenceDto(k.Key, k.Name, k.Hint, mine.GetValueOrDefault(k.Key, true)))]);
    }

    public async Task<Result> SaveAsync(SaveNotificationPreferencesRequest request, CancellationToken cancellationToken = default)
    {
        var offered = (await kinds.OfferedAsync(tenant.Role, cancellationToken)).Select(k => k.Key).ToHashSet();
        var choices = request.Kinds ?? [];
        // A kind the role receives whose module is off answers 404, as every endpoint of an off module does (L2-121).
        var receivable = NotificationKinds.All.Where(k => k.Receives(tenant.Role)).Select(k => k.Key).ToHashSet();
        if (choices.Any(c => c.Key is not null && receivable.Contains(c.Key) && !offered.Contains(c.Key)))
        {
            return Result.NotFound;
        }
        if (choices.Any(c => c.Key is null || !offered.Contains(c.Key)))
        {
            return Result.Invalid(new Dictionary<string, string> { ["kinds"] = "Choose only the notifications offered to you." });
        }
        var mine = await db.NotificationPreferences.Where(p => p.MembershipId == tenant.MembershipId).ToListAsync(cancellationToken);
        foreach (var choice in choices)
        {
            if (mine.FirstOrDefault(p => p.Kind == choice.Key) is { } row)
            {
                row.Change(choice.InApp);
            }
            else
            {
                var added = new NotificationPreference(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, choice.Key!, choice.InApp);
                db.NotificationPreferences.Add(added);
                mine.Add(added);
            }
        }
        var off = mine.Where(p => !p.InApp && offered.Contains(p.Kind)).Select(p => p.Kind).Order(StringComparer.Ordinal).ToList();
        audit.Record(new AuditEvent(AuditAction.Updated, "NotificationPreferences", tenant.MembershipId,
            off.Count == 0 ? $"{tenant.ActorName} gets every notification" : $"{tenant.ActorName} turned off {string.Join(", ", off)}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
