using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Per-child consent for the financial module (L2-145): the children still to consent for, then one <see cref="LearningBondConsent"/> with
/// scope LearningBond per ticked child, each starting that child's claim, audited. It never reads or writes a program consent.
/// </summary>
public sealed class LearningBondConsentHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondFamilyChildren familyChildren, IAuditWriter audit,
    TimeProvider clock)
{
    public const string NoChildMessage = "Tick at least one child.";
    public const string NoNameMessage = "Type your full name to sign.";
    public const string NotGuardianMessage = "Type the full name of a guardian of this household.";

    public async Task<GuardianResult> GetAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var code = GuardianLanguage.Code(scope!.Household.Language);
        var open = await OpenChildrenAsync(scope.Household.Id, scope.Organization.TimeZone, cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, new LearningBondConsentPageDto(code, scope.Organization.Name, AgentFallbackCopy.Consent(code, scope.Organization.Name),
            LearningBondTexts.ConsentVersion, [.. open.Select(c => new LearningBondConsentChildDto(c.Id, c.FirstName, LearningBondTexts.Consent(code, c.FirstName)))]));
    }

    public async Task<GuardianResult> GiveAsync(GuardianRequest request, GiveLearningBondConsentRequest consent, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var household = scope!.Household;
        if (consent.Scope == nameof(LearningBondConsentScope.Benefits))
        {
            return await GiveBenefitsAsync(scope, consent, cancellationToken);
        }
        var ticked = (consent.ChildIds ?? []).Distinct().ToList();
        var typed = string.Join(' ', (consent.TypedName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries));
        var errors = new Dictionary<string, string>();
        if (ticked.Count == 0)
        {
            errors["children"] = NoChildMessage;
        }
        if (typed.Length == 0)
        {
            errors["typedName"] = NoNameMessage;
        }
        if (errors.Count > 0)
        {
            return new GuardianResult(GuardianOutcome.Invalid, Errors: errors);
        }
        var open = await OpenChildrenAsync(household.Id, scope.Organization.TimeZone, cancellationToken);
        // A child who isn't one of this household's eligible children is not this guardian's to consent for (criterion 5).
        if (ticked.Any(id => open.All(c => c.Id != id)))
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == household.Id).Select(g => g.Name).ToListAsync(cancellationToken);
        if (!guardians.Any(g => string.Equals(g, typed, StringComparison.OrdinalIgnoreCase)) || typed.Length > LearningBondConsent.MaximumName)
        {
            return GuardianResult.Invalid("typedName", NotGuardianMessage);
        }
        var now = clock.GetUtcNow();
        var code = GuardianLanguage.Code(household.Language);
        var ids = new List<Guid>();
        foreach (var child in open.Where(c => ticked.Contains(c.Id)))
        {
            var given = new LearningBondConsent(Guid.NewGuid(), household.OrganizationId, household.Id, child.Id, LearningBondConsentScope.LearningBond, typed,
                LearningBondTexts.ConsentVersion, code, now);
            db.LearningBondConsents.Add(given);
            db.LearningBondClaims.Add(new LearningBondClaim(Guid.NewGuid(), household.OrganizationId, household.Id, child.Id, given.Id, now));
            audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondConsent), given.Id, $"Learning Bond consent given for {child.FirstName} by {typed}"));
            ids.Add(given.Id);
        }
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Created, new { ids });
    }

    /// <summary>The household's children under 18 with an amount and no Learning Bond consent in force.</summary>
    /// <summary>
    /// The Benefits consent (L2-153 criteria 2 and 4): its own wording, one record per child under 18 with scope Benefits, never counted as a
    /// Learning Bond consent; no claim is started.
    /// </summary>
    private async Task<GuardianResult> GiveBenefitsAsync(GuardianScope scope, GiveLearningBondConsentRequest consent, CancellationToken cancellationToken)
    {
        var household = scope.Household;
        var typed = string.Join(' ', (consent.TypedName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries));
        if (typed.Length == 0)
        {
            return GuardianResult.Invalid("typedName", NoNameMessage);
        }
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == household.Id).Select(g => g.Name).ToListAsync(cancellationToken);
        if (!guardians.Any(g => string.Equals(g, typed, StringComparison.OrdinalIgnoreCase)) || typed.Length > LearningBondConsent.MaximumName)
        {
            return GuardianResult.Invalid("typedName", NotGuardianMessage);
        }
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(scope.Organization.TimeZone)).DateTime);
        var given = await db.LearningBondConsents.AsNoTracking().Where(c => c.HouseholdId == household.Id && c.Scope == LearningBondConsentScope.Benefits
            && c.WithdrawnAt == null && c.ClosedAt == null).Select(c => c.ChildId).ToListAsync(cancellationToken);
        var children = (await db.Children.AsNoTracking().Where(c => c.HouseholdId == household.Id).ToListAsync(cancellationToken))
            .Where(c => c.AgeOn(today) is null or < 18 && !given.Contains(c.Id)).ToList();
        var code = GuardianLanguage.Code(household.Language);
        var ids = new List<Guid>();
        foreach (var child in children)
        {
            var benefits = new LearningBondConsent(Guid.NewGuid(), household.OrganizationId, household.Id, child.Id, LearningBondConsentScope.Benefits, typed,
                LearningBondTexts.BenefitsConsentVersion, code, now);
            db.LearningBondConsents.Add(benefits);
            audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondConsent), benefits.Id, $"Benefits consent given for {child.FirstName} by {typed}"));
            ids.Add(benefits.Id);
        }
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Created, new { ids });
    }

    private async Task<List<GuardianLearningBondChildDto>> OpenChildrenAsync(Guid householdId, string timeZone, CancellationToken cancellationToken)
    {
        var consented = await db.LearningBondConsents.AsNoTracking()
            .Where(c => c.HouseholdId == householdId && c.Scope == LearningBondConsentScope.LearningBond && c.WithdrawnAt == null && c.ClosedAt == null)
            .Select(c => c.ChildId).ToListAsync(cancellationToken);
        return [.. (await familyChildren.ForAsync(householdId, timeZone, cancellationToken)).Where(c => !c.SelfClaim && c.Amount is not null && !consented.Contains(c.Id))];
    }
}
