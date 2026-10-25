using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Guardian;

namespace PromiseHub.Application.Guardian;

/// <summary>Mints a link for one household and one child's slip; returns the address to text, keeping only the token's hash.</summary>
public sealed class GuardianLinkIssuer(IPromiseHubDb db, ITenantContext tenant, GuardianLinkOptions options, TimeProvider clock)
{
    public string Issue(Guid householdId, Guid slipId, Guid childId)
    {
        var token = GuardianTokens.New();
        db.GuardianLinks.Add(new GuardianLink(Guid.NewGuid(), tenant.OrganizationId, householdId, slipId, childId, GuardianTokens.Hash(token), clock.GetUtcNow()));
        return $"{options.BaseUrl.TrimEnd('/')}/g/slip/{token}";
    }
}
