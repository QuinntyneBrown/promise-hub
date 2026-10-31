using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Guardian;

namespace PromiseHub.Application.Guardian;

/// <summary>Mints a link for one household (a child's slip, survey or consent, or the home page); returns the address to text, keeping only the token's hash.</summary>
public sealed class GuardianLinkIssuer(IPromiseHubDb db, ITenantContext tenant, GuardianLinkOptions options, TimeProvider clock)
{
    public string Issue(Guid householdId, Guid slipId, Guid childId)
    {
        var token = GuardianTokens.New();
        db.GuardianLinks.Add(new GuardianLink(Guid.NewGuid(), tenant.OrganizationId, householdId, slipId, childId, GuardianTokens.Hash(token), clock.GetUtcNow()));
        return $"{options.BaseUrl.TrimEnd('/')}/g/slip/{token}";
    }

    public string IssueSurvey(Guid householdId, Guid surveyId, Guid childId)
    {
        var token = GuardianTokens.New();
        db.GuardianLinks.Add(new GuardianLink(Guid.NewGuid(), tenant.OrganizationId, householdId, null, childId, GuardianTokens.Hash(token), clock.GetUtcNow(), surveyId));
        return $"{options.BaseUrl.TrimEnd('/')}/g/survey/{token}";
    }

    /// <summary>A consent link for one child of the household (ADR 0046).</summary>
    public string IssueConsent(Guid householdId, Guid childId)
    {
        var token = GuardianTokens.New();
        db.GuardianLinks.Add(new GuardianLink(Guid.NewGuid(), tenant.OrganizationId, householdId, null, childId, GuardianTokens.Hash(token), clock.GetUtcNow(), forConsent: true));
        return $"{options.BaseUrl.TrimEnd('/')}/g/consent/{token}";
    }

    public string IssueHome(Guid householdId)
    {
        var token = GuardianTokens.New();
        db.GuardianLinks.Add(new GuardianLink(Guid.NewGuid(), tenant.OrganizationId, householdId, null, null, GuardianTokens.Hash(token), clock.GetUtcNow()));
        return $"{options.BaseUrl.TrimEnd('/')}/g/home/{token}";
    }

    /// <summary>A household's Learning Bond link, carried by its invitation (L2-140 criterion 10, ADR 0079); only the token's hash is kept.</summary>
    public string IssueLearningBond(Guid householdId)
    {
        var token = GuardianTokens.New();
        db.GuardianLinks.Add(new GuardianLink(Guid.NewGuid(), tenant.OrganizationId, householdId, null, null, GuardianTokens.Hash(token), clock.GetUtcNow()));
        return $"{options.BaseUrl.TrimEnd('/')}/g/learning-bond/{token}";
    }
}
