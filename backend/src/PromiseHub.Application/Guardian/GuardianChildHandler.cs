using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Events;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// A child's page on the guardian portal (L2-102, L2-104, ADR 0067): the household and the tenant come from the link; the child id only selects
/// among that household's children. Read only: the schedule of the next 28 days and the consents on record.
/// </summary>
public sealed class GuardianChildHandler(IPromiseHubDb db, GuardianAccess access, IModuleGate modules, ConsentGate consent, TimeProvider clock)
{
    public static readonly TimeSpan Window = TimeSpan.FromDays(28);

    public async Task<GuardianResult> GetAsync(GuardianRequest request, Guid childId, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null || scope.Link.SlipId is not null || scope.Link.SurveyId is not null || scope.Link.ForConsent)
        {
            return GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(scope?.Organization));
        }
        if (!await modules.IsOnAsync(ModuleId.Roster, cancellationToken))
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        if (!scope.Trusted)
        {
            return GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, []));
        }
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId && c.HouseholdId == scope.Household.Id, cancellationToken);
        if (child is null)
        {
            return GuardianResult.Of(GuardianOutcome.NotFound);
        }
        var programIds = await YouthEvents.ProgramIdsAsync(db, child.Id, cancellationToken);
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var now = clock.GetUtcNow();
        var zone = await EventRules.ZoneAsync(db, scope.Organization.Id, cancellationToken);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).DateTime);
        var events = (await db.Events.AsNoTracking().Where(e => programIds.Contains(e.ProgramId)).ToListAsync(cancellationToken))
            .Where(e => e.EndsAt > now && e.StartsAt <= now + Window && e.Status != EventStatus.Ended)
            .OrderBy(e => e.StartsAt).ThenBy(e => e.Name, StringComparer.Ordinal)
            .ToList();
        var schedule = events.Select(e => new GuardianSessionDto(e.Id, e.Name, programs[e.ProgramId], e.StartsAt, e.EndsAt, e.Place,
            e.Status == EventStatus.Cancelled ? "Cancelled" : "Scheduled", DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(e.StartsAt, zone).DateTime) == today)).ToList();
        var consents = new GuardianConsentsDto(await ParticipationAsync(child.Id, cancellationToken),
            await modules.IsOnAsync(ModuleId.Slips, cancellationToken) ? await SlipsAsync(child.Id, programIds, now, cancellationToken) : null);
        return GuardianResult.Of(GuardianOutcome.Ok, new GuardianChildDto(GuardianLanguage.Code(scope.Household.Language), scope.Organization.Name, scope.Organization.Phone,
            child.FullName, child.FirstName, [.. programs.Values.Order(StringComparer.Ordinal)], schedule, consents));
    }

    /// <summary>The child's youth account, active, if one links the child.</summary>
    private Task<Guid?> YouthAsync(Guid childId, CancellationToken cancellationToken) =>
        db.Memberships.AsNoTracking().Where(m => m.ChildId == childId && m.Role == Role.Youth && m.RemovedAt == null)
            .Select(m => (Guid?)m.Id).FirstOrDefaultAsync(cancellationToken);

    private async Task<GuardianParticipationDto?> ParticipationAsync(Guid childId, CancellationToken cancellationToken)
    {
        if (await YouthAsync(childId, cancellationToken) is null)
        {
            return null;
        }
        var status = await consent.StatusAsync(childId, cancellationToken);
        var latest = status.Latest;
        return status.Required || latest is not null
            ? new GuardianParticipationDto(status.Name, latest?.SignedBy, latest?.Relationship, latest?.SignedAt, latest?.Reference, latest?.WithdrawnAt, latest?.WithdrawnBy)
            : null;
    }

    private async Task<IReadOnlyList<GuardianSlipConsentDto>> SlipsAsync(Guid childId, List<Guid> programIds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var rows = (await (from s in db.PermissionSlips.AsNoTracking()
                           join e in db.Events.AsNoTracking() on s.EventId equals e.Id
                           where s.Status == SlipStatus.Sent && programIds.Contains(e.ProgramId)
                           select new { Slip = s, Event = e }).ToListAsync(cancellationToken))
            .Where(r => r.Event.EndsAt > now && r.Event.Status != EventStatus.Ended)
            .OrderBy(r => r.Event.StartsAt)
            .ToList();
        var slipIds = rows.Select(r => r.Slip.Id).ToList();
        var answers = (await db.SlipSignatures.AsNoTracking()
                .Where(a => a.ChildId == childId && slipIds.Contains(a.SlipId) && a.Status != SignatureStatus.Superseded).ToListAsync(cancellationToken))
            .GroupBy(a => a.SlipId).ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.At).First());
        return [.. rows.Select(r =>
        {
            var answer = answers.GetValueOrDefault(r.Slip.Id);
            return new GuardianSlipConsentDto(r.Event.Id, r.Event.Name, r.Event.StartsAt, r.Slip.SignBy,
                answer is null ? "NotSigned" : answer.Status.ToString(), answer?.SignedBy, answer?.At);
        })];
    }
}
