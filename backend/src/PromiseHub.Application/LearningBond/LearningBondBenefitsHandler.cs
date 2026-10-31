using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The benefits check (L2-153 to L2-156): the offer and Not now, the Benefits consent page, the intake that reuses the Learning Bond answers
/// and asks at most three facts more, and the list of benefits with exactly one state each, computed by the catalogue's rules.
/// </summary>
public sealed class LearningBondBenefitsHandler(IPromiseHubDb db, LearningBondGuardianScope guardianScope, LearningBondBenefitsAccess access, IAuditWriter audit,
    TimeProvider clock)
{
    public const string SizeMessage = "Enter how many people live with you, from 1 to 15.";
    public const string ChooseMessage = "Choose one.";
    public const string IncomeNote = "These estimates use your last tax return. A big change this year can change them.";

    public static readonly string[] MaritalStatuses = ["Married", "CommonLaw", "Separated", "Divorced", "Widowed", "Single"];
    public static readonly string[] Answers3 = ["Yes", "No", "NotSure"];
    public static readonly string[] Claims = ["Me", "OtherParent", "Shared", "NotSure"];

    /// <summary>Not now on the confirmation is remembered; the offer stays on the guardian page (L2-153 criterion 1).</summary>
    public async Task<GuardianResult> DismissOfferAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        (await access.CheckAsync(scope!, cancellationToken)).DismissOffer(clock.GetUtcNow());
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    public async Task<GuardianResult> ConsentPageAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await guardianScope.TrustedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var code = GuardianLanguage.Code(scope!.Household.Language);
        return GuardianResult.Of(GuardianOutcome.Ok, new BenefitsConsentDto(code, scope.Organization.Name, LearningBondTexts.BenefitsConsent(code),
            LearningBondTexts.BenefitsConsentVersion, await access.ConsentedAsync(scope.Household.Id, cancellationToken)));
    }

    public async Task<GuardianResult> IntakeAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await access.ConsentedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var children = await access.ChildrenAsync(scope!, cancellationToken);
        var answers = await access.AnswersAsync(scope!.Household.Id, cancellationToken);
        var intake = await db.LearningBondIntakes.AsNoTracking().FirstOrDefaultAsync(i => i.HouseholdId == scope.Household.Id, cancellationToken);
        var code = GuardianLanguage.Code(scope.Household.Language);
        return GuardianResult.Of(GuardianOutcome.Ok, new BenefitsIntakeDto(code, scope.Organization.Name, AgentFallbackCopy.BenefitsIntake(code, [.. children.Select(c => c.FirstName)]),
            [.. children.Select(c => new BenefitsIntakeChildDto(c.Id, c.FirstName, c.Age, answers?.Custody.GetValueOrDefault(c.Id)))],
            intake?.GuardianSin is { IsDestroyed: false }, intake?.TaxFiled is not null, answers?.HouseholdSize, answers?.MaritalStatus, answers?.CcbNow, answers?.IncomeChanged));
    }

    public async Task<GuardianResult> SaveIntakeAsync(GuardianRequest request, SaveBenefitsIntakeRequest body, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await access.ConsentedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        var errors = new Dictionary<string, string>();
        if (body.HouseholdSize is not (>= 1 and <= 15))
        {
            errors["householdSize"] = SizeMessage;
        }
        if (!MaritalStatuses.Contains(body.MaritalStatus))
        {
            errors["maritalStatus"] = ChooseMessage;
        }
        if (!Answers3.Contains(body.CcbNow))
        {
            errors["ccbNow"] = ChooseMessage;
        }
        if (body.IncomeChanged is not null && body.IncomeChanged is not ("Yes" or "No"))
        {
            errors["incomeChanged"] = ChooseMessage;
        }
        var children = await access.ChildrenAsync(scope!, cancellationToken);
        var custody = new Dictionary<Guid, string>();
        if (body.MaritalStatus is "Separated" or "Divorced")
        {
            foreach (var child in children)
            {
                if (body.Custody?.GetValueOrDefault(child.Id) is { } claims && Claims.Contains(claims))
                {
                    custody[child.Id] = claims;
                }
                else
                {
                    errors[$"custody.{child.Id}"] = ChooseMessage;
                }
            }
        }
        if (errors.Count > 0)
        {
            return new GuardianResult(GuardianOutcome.Invalid, Errors: errors);
        }
        var check = await access.CheckAsync(scope!, cancellationToken);
        check.SetAnswers(access.Encrypt(new BenefitAnswers(body.HouseholdSize!.Value, body.MaritalStatus!, body.CcbNow!, body.IncomeChanged, custody)), clock.GetUtcNow());
        // Field names only, never a value (L2-159, L2-161).
        audit.Record(new AuditEvent(AuditAction.Updated, nameof(LearningBondBenefitsCheck), check.Id, "Benefits intake saved: household size, marital status, Canada Child Benefit"));
        await db.SaveChangesAsync(cancellationToken);
        return GuardianResult.Of(GuardianOutcome.Done);
    }

    public async Task<GuardianResult> ListAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var (gate, scope) = await access.ConsentedAsync(request, cancellationToken);
        if (gate is not null)
        {
            return gate;
        }
        if (await access.AnswersAsync(scope!.Household.Id, cancellationToken) is not { } answers)
        {
            return GuardianResult.Of(GuardianOutcome.Conflict, new { code = "intake-incomplete" });
        }
        var children = await access.ChildrenAsync(scope, cancellationToken);
        // Not sure who claims a child stops the check for that child; The other parent claims them, so nothing is offered for them (L2-154 criterion 4).
        var blocked = children.Where(c => answers.Custody.GetValueOrDefault(c.Id) == "NotSure").ToList();
        var claimable = children.Where(c => answers.Custody.GetValueOrDefault(c.Id) is null or "Me" or "Shared").ToList();
        var household = new BenefitHousehold(answers, [.. claimable.Select(c => (c.FirstName, c.Age ?? 0))]);
        var province = RespProviders.ProvinceOf(scope.Organization.TimeZone);
        var applications = await db.LearningBondBenefitApplications.AsNoTracking().Where(a => a.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
        var applicationIds = applications.Select(a => a.Id).ToList();
        var documents = await db.LearningBondDocuments.AsNoTracking().Where(d => applicationIds.Contains(d.ApplicationId) && d.FileName != null).ToListAsync(cancellationToken);
        var items = BenefitCatalogue.For(province, scope.Organization.City).Select(entry =>
        {
            var application = applications.FirstOrDefault(a => a.BenefitKey == entry.Key);
            var file = application is null ? null : documents.FirstOrDefault(d => d.ApplicationId == application.Id)?.FileName;
            var amount = entry.Rule.PerChild is { } perChild && claimable.Count > 0 ? claimable.Sum(c => perChild(c.Age ?? 0)) : (int?)null;
            var reason = entry.Rule.NotEligible?.Invoke(household);
            var state = application?.Sent == true ? "Submitted"
                : entry.Rule.AlreadyGets?.Invoke(household) == true ? "AlreadyGet"
                : reason is not null ? "NotEligible"
                : entry.Rule.Document is not null && file is null ? "NeedDocument"
                : "ApplyNow";
            return new BenefitItemDto(entry.Key, entry.Name, entry.Level.ToString(), amount, state, state == "NotEligible" ? reason : null, entry.Rule.Document, file,
                entry.Channel.ToString(), entry.Source, entry.SourceLink, application?.RuleVersion ?? entry.RuleVersion, application?.Id);
        }).ToList();
        var code = GuardianLanguage.Code(scope.Household.Language);
        var place = $"{BenefitCatalogue.MunicipalityOf(scope.Organization.City)}, {scope.Organization.City.Split(',').Skip(1).FirstOrDefault()?.Trim() ?? province}";
        return GuardianResult.Of(GuardianOutcome.Ok, new BenefitsDto(code, scope.Organization.Name, AgentFallbackCopy.Benefits(code, place.TrimEnd(',', ' ')), items,
            [.. blocked.Select(c => $"We can’t check benefits for {c.FirstName} until it’s clear who claims them. Staff can help.")],
            answers.IncomeChanged == "Yes" ? IncomeNote : null,
            BenefitCatalogue.KnowsLocal(province, scope.Organization.City) ? null : $"We don’t know local programs for {BenefitCatalogue.MunicipalityOf(scope.Organization.City)} yet.",
            items.All(i => i.State is "AlreadyGet" or "NotEligible" or "Submitted") && items.Any(i => i.State == "AlreadyGet")));
    }
}
