using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Website;

/// <summary>
/// The public website (L2-005 criterion 7). The slug chooses the tenant, the one place a tenant is chosen without a membership,
/// so the tenant filter is bypassed for this one organization. An unknown slug, a suspended organization and a module that is
/// off all answer the same: not found.
/// </summary>
public sealed class PublicWebsiteHandler(IPromiseHubDb db)
{
    public async Task<PublicSiteDto?> HandleAsync(string slug, CancellationToken cancellationToken = default)
    {
        var key = slug.Trim().ToLowerInvariant();
        var organization = await db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.WebsiteSlug == key && o.SuspendedAt == null, cancellationToken);
        if (organization is null)
        {
            return null;
        }
        var configuration = await db.ModuleConfigurations.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(c => c.OrganizationId == organization.Id, cancellationToken);
        return configuration?.On.Contains(ModuleId.PublicWebsite) == true ? new PublicSiteDto(organization.Name, organization.City) : null;
    }
}
