using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Prepares and reviews a child's application (L2-148): the first no-fee provider serving the household's province, every field filled from
/// the intake and the household record, and edits for this application only, each moving the review version. Nothing is sent here.
/// </summary>
public sealed class LearningBondApplicationHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondClaimFinder claims, IAuditWriter audit,
    TimeProvider clock)
{
    public const string PhoneMessage = "Enter a 10-digit mobile number.";
    public const string EmailMessage = "Enter an email like name@example.org.";
    public const string AddressMessage = "Enter the street address, city and postal code.";
    public const string ProvinceMessage = "Choose a province or territory.";
    public const string ProviderMessage = "Choose a provider that serves your province.";

    /// <summary>The child's open application, created on the first visit once the estimate is in and no tax return is awaited.</summary>
    public async Task<GuardianResult> PrepareAsync(GuardianRequest request, Guid childId, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await claims.ForChildAsync(scope!.Household.Id, childId, cancellationToken: cancellationToken) is not { } claim)
        {
            return GuardianResult.Of(GuardianOutcome.Forbidden);
        }
        if (claim.EstimateAmount is null || claim.PausedReason is not null)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "not-ready" });
        }
        var application = (await db.LearningBondApplications.Where(a => a.ClaimId == claim.Id).ToListAsync(cancellationToken))
            .Where(a => a.Status != LearningBondApplicationStatus.Cancelled).OrderByDescending(a => a.CreatedAt).FirstOrDefault();
        if (application is null)
        {
            var guardian = await PrimaryAsync(scope.Household.Id, cancellationToken);
            var province = RespProviders.ProvinceOf(scope.Organization.TimeZone);
            application = new LearningBondApplication(Guid.NewGuid(), scope.Household.OrganizationId, scope.Household.Id, childId, claim.Id, province,
                RespProviders.Serving(province).FirstOrDefault()?.Name, guardian?.Mobile, guardian?.EmailBounced == false ? guardian.Email : null, clock.GetUtcNow());
            db.LearningBondApplications.Add(application);
            audit.Record(new AuditEvent(AuditAction.Created, nameof(LearningBondApplication), application.Id, "Learning Bond application prepared"));
            await db.SaveChangesAsync(cancellationToken);
        }
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope, application, cancellationToken));
    }

    /// <summary>Changes one field for this application only (criterion 4); a SIN is never edited here.</summary>
    public async Task<GuardianResult> EditFieldAsync(GuardianRequest request, Guid applicationId, string field, LearningBondFieldValueRequest change,
        CancellationToken cancellationToken = default)
    {
        var (gate, scope, application) = await OwnAsync(request, applicationId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var value = (change.Value ?? string.Empty).Trim();
        var now = clock.GetUtcNow();
        switch (field)
        {
            case "phone" when ContactMask.Digits(value) is { Length: 10 } digits:
                application!.ChangePhone($"{digits[..3]}-{digits[3..6]}-{digits[6..]}", now);
                break;
            case "phone":
                return GuardianResult.Invalid("value", PhoneMessage);
            case "email" when EmailAddressRule.IsValid(value):
                application!.ChangeEmail(value, now);
                break;
            case "email":
                return GuardianResult.Invalid("value", EmailMessage);
            case "address" when value.Length is >= 10 and <= LearningBondApplication.MaximumAddress:
                application!.ChangeAddress(value, now);
                break;
            case "address":
                return GuardianResult.Invalid("value", AddressMessage);
            case "province" when RespProviders.Provinces.Contains(value.ToUpperInvariant()):
                var province = value.ToUpperInvariant();
                var serving = RespProviders.Serving(province);
                application!.ChangeProvince(province, serving.Any(p => p.Name == application.Provider) ? application.Provider : serving.FirstOrDefault()?.Name, now);
                break;
            case "province":
                return GuardianResult.Invalid("value", ProvinceMessage);
            default:
                return GuardianResult.Invalid("value", "This field can’t be changed here.");
        }
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondApplication), application!.Id, $"Learning Bond application: {field} changed"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope!, application, cancellationToken));
    }

    /// <summary>Choose another: only a provider on the platform's list that serves the province (criterion 1).</summary>
    public async Task<GuardianResult> ChooseProviderAsync(GuardianRequest request, Guid applicationId, ChooseRespProviderRequest choice,
        CancellationToken cancellationToken = default)
    {
        var (gate, scope, application) = await OwnAsync(request, applicationId, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (RespProviders.Named(choice.Name) is not { } provider || !provider.Provinces.Contains(application!.Province))
        {
            return GuardianResult.Invalid("provider", ProviderMessage);
        }
        application.ChooseProvider(provider.Name, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondApplication), application.Id, $"Learning Bond application: provider {provider.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Ok, await DtoAsync(scope!, application, cancellationToken));
    }

    /// <summary>The household's application that can still be edited, or why not.</summary>
    internal async Task<(GuardianResult? Gate, GuardianScope? Scope, LearningBondApplication? Application)> OwnAsync(GuardianRequest request, Guid applicationId,
        CancellationToken cancellationToken, bool editable = true)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return (gate, null, null);
        }
        var application = await db.LearningBondApplications.FirstOrDefaultAsync(a => a.Id == applicationId && a.HouseholdId == scope!.Household.Id, cancellationToken);
        if (application is null || await claims.ForChildAsync(scope!.Household.Id, application.ChildId, cancellationToken: cancellationToken) is null)
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null, null);
        }
        if (editable && !application.Editable)
        {
            return (GuardianResult.Of(GuardianOutcome.Conflict, new { code = "submitted" }), null, null);
        }
        return (null, scope, application);
    }

    internal async Task<LearningBondApplicationDto> DtoAsync(GuardianScope scope, LearningBondApplication application, CancellationToken cancellationToken)
    {
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == application.ChildId, cancellationToken);
        var claim = await db.LearningBondClaims.AsNoTracking().SingleAsync(c => c.Id == application.ClaimId, cancellationToken);
        var intake = await db.LearningBondIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.HouseholdId == scope.Household.Id, cancellationToken);
        var guardian = await PrimaryAsync(scope.Household.Id, cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        var serving = RespProviders.Serving(application.Province);
        return new LearningBondApplicationDto(application.Id, code, scope.Organization.Name, AgentFallbackCopy.Review(code, application.Provider ?? RespProviders.All[0].Name),
            child.Id, child.FirstName, application.Status.ToString(), application.ReviewVersion, application.Province, application.Provider, RespProviders.Reason,
            [.. serving.Select(p => p.Name)], serving.Count == 0,
            new LearningBondApplicationFieldsDto(child.FullName, child.DateOfBirth, claim.ChildSinLast3, guardian?.Name ?? string.Empty, application.Address,
                intake?.GuardianSinLast3, application.Phone, application.Email, scope.Household.Language));
    }

    private async Task<Domain.Households.Guardian?> PrimaryAsync(Guid householdId, CancellationToken cancellationToken) =>
        (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == householdId).ToListAsync(cancellationToken))
            .OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture).FirstOrDefault();
}
