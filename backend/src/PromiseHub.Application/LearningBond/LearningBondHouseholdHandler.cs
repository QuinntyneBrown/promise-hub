using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One household's Learning Bond card and the invitation at the door (L2-140 criteria 4, 5 and 8): for staff whose role is in the
/// organization's status roles only. Another organization's household is unknown; a household no covered program reaches is not invited.
/// </summary>
public sealed class LearningBondHouseholdHandler(IPromiseHubDb db, ITenantContext tenant, LearningBondCoverage coverage, LearningBondInvitationSender sender,
    LearningBondStatusRoles roles, IAuditWriter audit, TimeProvider clock)
{
    public async Task<(ResultStatus Status, LearningBondHouseholdDto? Card)> GetAsync(Guid householdId, CancellationToken cancellationToken = default)
    {
        if (!await SeesStatusAsync(cancellationToken))
        {
            return (ResultStatus.Forbidden, null);
        }
        if (await db.Households.AsNoTracking().FirstOrDefaultAsync(h => h.Id == householdId && h.DeletedAt == null, cancellationToken) is not { } household)
        {
            return (ResultStatus.NotFound, null);
        }
        var covered = (await coverage.CoveredAsync(cancellationToken)).FirstOrDefault(c => c.HouseholdId == householdId);
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == householdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name)
            .ToListAsync(cancellationToken);
        var organization = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => o.Name).SingleAsync(cancellationToken);
        var name = await db.LearningBondSettings.AsNoTracking().Select(s => s.SenderName).FirstOrDefaultAsync(cancellationToken) ?? SenderNameRule.Default(organization);
        var code = GuardianLanguage.Code(household.Language);
        var children = covered?.Children ?? [];
        var sms = LearningBondTexts.Sms(code, name, children, LearningBondTexts.SampleLink);
        return (ResultStatus.Done, new LearningBondHouseholdDto(householdId, household.Name, covered is not null, covered?.Programs ?? [], children,
            await InvitedAtAsync(householdId, cancellationToken),
            [.. guardians.Where(g => !string.IsNullOrWhiteSpace(g.Mobile) || (!string.IsNullOrWhiteSpace(g.Email) && !g.EmailBounced)).Select(g => g.Name)],
            LearningBondTexts.LanguageName(code), sms, sms.Length, SmsSegments.Count(sms)));
    }

    /// <summary>Queues the household's invitation at once, unless it was invited in the last 7 days, which answers when (criteria 4 and 5).</summary>
    public async Task<LearningBondInviteOutcome> InviteAsync(Guid householdId, CancellationToken cancellationToken = default)
    {
        if (!await SeesStatusAsync(cancellationToken))
        {
            return new(ResultStatus.Forbidden);
        }
        if ((await coverage.CoveredAsync(cancellationToken)).FirstOrDefault(c => c.HouseholdId == householdId) is not { } covered)
        {
            return new(ResultStatus.NotFound);
        }
        if (await InvitedAtAsync(householdId, cancellationToken) is { } when)
        {
            return new(ResultStatus.Done, when);
        }
        if ((await sender.QueueAsync([covered], LearningBondLaunchMode.AtTheDoor, cancellationToken)).Count == 0)
        {
            return new(ResultStatus.NotFound);
        }
        var name = await db.Households.AsNoTracking().Where(h => h.Id == householdId).Select(h => h.Name).SingleAsync(cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondInvitation), householdId, $"Learning Bond invitation sent to the {name} household at the door"));
        await db.SaveChangesAsync(cancellationToken);
        return new(ResultStatus.Created, clock.GetUtcNow());
    }

    /// <summary>
    /// Mark call done (L2-142 criteria 4 and 7): records the outcome of the household's open call request, audited; the status follows it.
    /// No answer keeps the request open, so the household stays Call requested to try again. No open request answers Conflict; another
    /// organization's household, NotFound.
    /// </summary>
    public async Task<Result> RecordCallAsync(Guid householdId, CallOutcomeRequest request, CancellationToken cancellationToken = default)
    {
        if (!await SeesStatusAsync(cancellationToken))
        {
            return Result.Forbidden;
        }
        if (await db.Households.AsNoTracking().FirstOrDefaultAsync(h => h.Id == householdId && h.DeletedAt == null, cancellationToken) is not { } household)
        {
            return Result.NotFound;
        }
        if (!Enum.TryParse<LearningBondCallOutcome>(request.Outcome, out var outcome) || !Enum.IsDefined(outcome))
        {
            return Result.Invalid(new Dictionary<string, string> { ["outcome"] = "Choose how the call went." });
        }
        var open = (await db.LearningBondCallRequests.Where(c => c.HouseholdId == householdId && c.DoneAt == null).ToListAsync(cancellationToken))
            .OrderBy(c => c.RequestedAt).ToList();
        if (open.Count == 0)
        {
            return Result.Conflict;
        }
        foreach (var call in open.Where(_ => outcome != LearningBondCallOutcome.NoAnswer))
        {
            call.Done(outcome, tenant.ActorName, clock.GetUtcNow());
        }
        var said = outcome switch { LearningBondCallOutcome.NotInterested => "Not interested", LearningBondCallOutcome.NoAnswer => "No answer", _ => "Resumed" };
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondCallRequest), householdId, $"Learning Bond call with the {household.Name} household done: {said}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>When the household was invited within the last 7 days, if it was.</summary>
    private async Task<DateTimeOffset?> InvitedAtAsync(Guid householdId, CancellationToken cancellationToken)
    {
        var since = clock.GetUtcNow() - LearningBondInvitation.Interval;
        var sent = await db.LearningBondInvitations.AsNoTracking().Where(i => i.HouseholdId == householdId).Select(i => i.SentAt).ToListAsync(cancellationToken);
        return sent.Where(s => s > since).Order().Select(s => (DateTimeOffset?)s).LastOrDefault();
    }

    private Task<bool> SeesStatusAsync(CancellationToken cancellationToken) => roles.SeesStatusAsync(cancellationToken);
}
