using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// Guardian announcements (L2-103, ADR 0067): the Messages-module messages with a sent delivery to the link's household, newest first, and
/// Mark all read, which sets <see cref="Delivery.ReadAt"/> on every delivery of the household. Reading is not audited: it changes no record.
/// </summary>
public sealed class GuardianAnnouncementsHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, TimeProvider clock)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await ScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var items = await ItemsAsync(scope!.Household.Id, cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianAnnouncementsDto(GuardianLanguage.Code(scope.Household.Language), scope.Organization.Name, scope.Organization.Phone,
            items.Count(i => !i.Read), items));
    }

    public async Task<GuardianResult> MarkReadAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (problem, scope) = await ScopeAsync(request, cancellationToken);
        if (problem is not null)
        {
            return problem;
        }
        var now = clock.GetUtcNow();
        foreach (var delivery in await Sent(scope!.Household.Id).Where(d => d.ReadAt == null).ToListAsync(cancellationToken))
        {
            delivery.MarkRead(now);
        }
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    /// <summary>The family page's count of unread announcements, or null while Messages is off (L2-103 criteria 2 and 5).</summary>
    public async Task<int?> UnreadAsync(Guid householdId, CancellationToken cancellationToken = default) =>
        await modules.IsOnAsync(ModuleId.Messages, cancellationToken) ? (await ItemsAsync(householdId, cancellationToken)).Count(i => !i.Read) : null;

    private IQueryable<Delivery> Sent(Guid householdId) =>
        from d in db.Deliveries
        join m in db.Messages on d.MessageId equals m.Id
        where d.HouseholdId == householdId && m.Source == MessageSource.Messages && d.SentAt != null
        select d;

    private async Task<List<GuardianAnnouncementDto>> ItemsAsync(Guid householdId, CancellationToken cancellationToken)
    {
        var rows = await (from d in db.Deliveries.AsNoTracking()
                          join m in db.Messages.AsNoTracking() on d.MessageId equals m.Id
                          where d.HouseholdId == householdId && m.Source == MessageSource.Messages && d.SentAt != null
                          select new { Message = m, d.Text, d.SentAt, d.ReadAt }).ToListAsync(cancellationToken);
        // One row per message, even when a household had more than one delivery of it; read once every copy is read.
        return [.. rows.GroupBy(r => r.Message.Id)
            .Select(g => new GuardianAnnouncementDto(g.Key, g.First().Message.Title, g.First().Text ?? g.First().Message.Body, g.First().Message.CreatedBy,
                g.Min(r => r.SentAt!.Value), g.All(r => r.ReadAt != null)))
            .OrderByDescending(a => a.SentAt)];
    }

    private async Task<(GuardianResult? Problem, GuardianScope? Scope)> ScopeAsync(GuardianRequest request, CancellationToken cancellationToken)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null || scope.Link.SurveyId is not null || scope.Link.ForConsent)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization)), null);
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken) || !await modules.IsOnAsync(ModuleId.Messages, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        if (!scope.Trusted)
        {
            return (GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, [])), null);
        }
        return (null, scope);
    }
}
