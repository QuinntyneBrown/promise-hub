using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Paused claims (L2-151): the guardian pauses for a child with no SIN yet; the paused view says what helps and where the claim resumes; the
/// guardian chooses reminders at 14 and 30 days, or none. Resuming is the intake or the estimate going on (<see cref="ResumeAsync"/>).
/// </summary>
public sealed class LearningBondPauseHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondClaimFinder claims, IAuditWriter audit,
    TimeProvider clock)
{
    public async Task<GuardianResult> PauseAsync(GuardianRequest request, Guid childId, PauseLearningBondClaimRequest pause, CancellationToken cancellationToken = default)
    {
        var (gate, _, claim) = await ClaimAsync(request, childId, tracked: true, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (pause.Reason != nameof(LearningBondPausedReason.NeedsSin))
        {
            return GuardianResult.Invalid("reason", "Choose why the claim waits.");
        }
        if (claim!.Status is not (LearningBondClaimStatus.Started or LearningBondClaimStatus.Paused))
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "not-open" });
        }
        claim.Pause(LearningBondPausedReason.NeedsSin, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondClaim), claim.Id, "Learning Bond claim paused: needs a SIN"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    public async Task<GuardianResult> GetAsync(GuardianRequest request, Guid childId, CancellationToken cancellationToken = default)
    {
        var (gate, scope, claim) = await ClaimAsync(request, childId, tracked: false, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (claim!.Status != LearningBondClaimStatus.Paused)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "not-paused" });
        }
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope!, claim, cancellationToken));
    }

    public async Task<GuardianResult> SetReminderAsync(GuardianRequest request, Guid childId, LearningBondReminderRequest choice, CancellationToken cancellationToken = default)
    {
        var (gate, scope, claim) = await ClaimAsync(request, childId, tracked: false, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (choice.Remind is not { } remind)
        {
            return GuardianResult.Invalid("remind", "Choose Yes, text me or No thanks.");
        }
        if (claim!.Status != LearningBondClaimStatus.Paused)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "not-paused" });
        }
        var now = clock.GetUtcNow();
        foreach (var open in (await db.LearningBondReminders.Where(r => r.ClaimId == claim.Id).ToListAsync(cancellationToken)).Where(r => r.Open))
        {
            open.Cancel(now);
        }
        if (remind)
        {
            foreach (var days in LearningBondReminder.Days)
            {
                db.LearningBondReminders.Add(new LearningBondReminder(Guid.NewGuid(), claim.OrganizationId, claim.HouseholdId, claim.Id, now.AddDays(days)));
            }
        }
        db.LearningBondChoices.Add(new LearningBondReminderChoice(Guid.NewGuid(), claim.OrganizationId, claim.Id, remind, now));
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondClaim), claim.Id, remind ? "Learning Bond reminders chosen" : "Learning Bond reminders declined"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope!, claim, cancellationToken));
    }

    /// <summary>The claim goes on: its pause ends and any reminders still to come are cancelled. The caller saves.</summary>
    public async Task ResumeAsync(LearningBondClaim claim, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        claim.Resume(now);
        foreach (var open in (await db.LearningBondReminders.Where(r => r.ClaimId == claim.Id).ToListAsync(cancellationToken)).Where(r => r.Open))
        {
            open.Cancel(now);
        }
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondClaim), claim.Id, "Learning Bond claim resumed"));
    }

    private async Task<LearningBondPausedDto> DtoAsync(GuardianScope scope, LearningBondClaim claim, CancellationToken cancellationToken)
    {
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == claim.ChildId, cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        var choice = (await db.LearningBondChoices.AsNoTracking().Where(c => c.ClaimId == claim.Id).ToListAsync(cancellationToken))
            .OrderByDescending(c => c.ChosenAt).FirstOrDefault();
        var zone = TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone);
        var dates = (await db.LearningBondReminders.AsNoTracking().Where(r => r.ClaimId == claim.Id).ToListAsync(cancellationToken))
            .Where(r => r.CancelledAt is null).OrderBy(r => r.DueAt).Select(r => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(r.DueAt, zone).DateTime)).ToList();
        return new LearningBondPausedDto(code, scope.Organization.Name, AgentFallbackCopy.Paused(code, child.FirstName, claim.PausedReason), child.Id, child.FirstName,
            claim.Status.ToString(), claim.PausedReason?.ToString(), LearningBondHelpLinks.For(claim.PausedReason, code),
            claim.PausedReason == LearningBondPausedReason.NeedsTaxReturn ? "estimate" : "intake", choice?.Remind, dates);
    }

    private async Task<(GuardianResult? Gate, GuardianScope? Scope, LearningBondClaim? Claim)> ClaimAsync(GuardianRequest request, Guid childId, bool tracked,
        CancellationToken cancellationToken)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return (gate, null, null);
        }
        return await claims.ForChildAsync(scope!.Household.Id, childId, tracked, cancellationToken) is { } claim
            ? (null, scope, claim)
            : (GuardianResult.Of(GuardianOutcome.Forbidden), null, null);
    }
}
