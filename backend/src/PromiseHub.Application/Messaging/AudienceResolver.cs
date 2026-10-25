using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// Turns a program or event, and optionally a household language, into the households of this organization with children
/// enrolled, each with the channel that reaches its primary guardian (L2-021, L2-001).
/// </summary>
public sealed class AudienceResolver(IPromiseHubDb db)
{
    public async Task<Audience> ResolveAsync(AudienceRequest request, CancellationToken cancellationToken)
    {
        var programId = request.ProgramId;
        string? label = null;
        if (request.EventId is { } eventId)
        {
            var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
            programId = e?.ProgramId ?? Guid.Empty;
            label = e?.Name;
        }
        if (programId is { } id)
        {
            label ??= (await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken))?.Name;
        }
        var householdIds = await (
            from en in db.Enrollments.AsNoTracking()
            where en.EndedAt == null && (programId == null || en.ProgramId == programId)
            join c in db.Children.AsNoTracking() on en.ChildId equals c.Id
            select c.HouseholdId).Distinct().ToListAsync(cancellationToken);
        var households = await db.Households.AsNoTracking()
            .Where(h => householdIds.Contains(h.Id) && (request.Language == null || h.Language == request.Language))
            .OrderBy(h => h.Name)
            .ToListAsync(cancellationToken);
        var ids = households.Select(h => h.Id).ToList();
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);

        var recipients = households.Select(h =>
        {
            var g = guardians.Where(x => x.HouseholdId == h.Id).OrderByDescending(x => x.IsPrimary).ThenBy(x => x.Name).FirstOrDefault();
            var mobile = string.IsNullOrWhiteSpace(g?.Mobile) ? null : g.Mobile;
            var email = string.IsNullOrWhiteSpace(g?.Email) || g.EmailBounced ? null : g.Email;
            return request.Channel switch
            {
                ChannelChoice.TextOnly => new Recipient(h.Id, h.Name, g?.Name, h.Language, Channel.Sms, mobile, null, mobile is null ? "No mobile number" : null),
                ChannelChoice.EmailOnly => new Recipient(h.Id, h.Name, g?.Name, h.Language, Channel.Email, email, null, email is null ? "No email address" : null),
                _ => mobile is not null
                    ? new Recipient(h.Id, h.Name, g?.Name, h.Language, Channel.Sms, mobile, email, null)
                    : new Recipient(h.Id, h.Name, g?.Name, h.Language, Channel.Email, email, null, email is null ? "No mobile number or email" : null),
            };
        }).ToList();

        var audience = label ?? "All programs";
        if (request.Language is { } language)
        {
            audience += $" · {language} households";
        }
        return new Audience(audience, recipients);
    }
}
