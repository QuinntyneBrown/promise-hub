using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The estimate (L2-147): computed by <see cref="LearningBondRule"/> from the child's birth year, never by the language model, and recorded on
/// the claim with the rule's version. Only once the intake is complete. With no tax return filed (or not sure) the claim pauses until one is
/// (L2-151); the estimate still shows.
/// </summary>
public sealed class LearningBondEstimateHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondClaimFinder claims, IAuditWriter audit,
    LearningBondPauseHandler pauses, TimeProvider clock)
{
    public async Task<GuardianResult> GetAsync(GuardianRequest request, Guid childId, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await claims.ForChildAsync(scope!.Household.Id, childId, tracked: true, cancellationToken) is not { } claim)
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        var intake = await db.LearningBondIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.HouseholdId == scope.Household.Id, cancellationToken);
        if (intake is not { GuardianSinLast3: not null, TaxFiled: { } taxFiled } || claim.ChildSinLast3 is null)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "intake-incomplete" });
        }
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == childId, cancellationToken);
        var now = clock.GetUtcNow();
        var year = TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone)).Year;
        var rule = LearningBondRule.Current;
        var bornBefore = child.DateOfBirth is { } born && born.Year < rule.EarliestBirthYear;
        var amount = child.DateOfBirth is { } birth ? rule.Estimate(birth.Year, year) : null;
        var needsTaxReturn = taxFiled != LearningBondTaxFiled.Yes;
        if (claim.EstimateAmount != amount || claim.RuleVersion != rule.Version)
        {
            claim.RecordEstimate(amount, rule.Version, now);
            // The amount is the family's; the audit names the rule only (L2-142).
            audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondClaim), claim.Id, $"Learning Bond estimate for {child.FirstName}: rule version {rule.Version}"));
        }
        if (needsTaxReturn && claim.PausedReason != LearningBondPausedReason.NeedsTaxReturn)
        {
            claim.Pause(LearningBondPausedReason.NeedsTaxReturn, now);
        }
        else if (!needsTaxReturn && claim.PausedReason == LearningBondPausedReason.NeedsTaxReturn)
        {
            await pauses.ResumeAsync(claim, cancellationToken);
        }
        await db.SaveChangesAsync(cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondEstimateDto(code, scope.Organization.Name, AgentFallbackCopy.Estimate(code, child.FirstName), child.Id,
            child.FirstName, amount, rule.Version, bornBefore, needsTaxReturn));
    }
}
