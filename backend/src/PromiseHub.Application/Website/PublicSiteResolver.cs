using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Website;

/// <summary>
/// Chooses the organization of a public website request from its address (ADR 0043, ADR 0075): the one place a tenant is chosen without a
/// membership. The address lookup alone ignores the tenant filter; the tenant is then resolved for a visitor so every later query is
/// filtered as usual. An unknown address, a suspended organization and Public website off all answer null, so a visitor cannot tell them apart.
/// </summary>
public sealed class PublicSiteResolver(IPromiseHubDb db, TenantContext tenant, IModuleGate modules)
{
    public async Task<Organization?> ResolveAsync(string address, CancellationToken cancellationToken = default)
    {
        var key = address.Trim().ToLowerInvariant();
        var organization = await db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.WebsiteSlug == key && o.SuspendedAt == null, cancellationToken);
        if (organization is null)
        {
            return null;
        }
        tenant.ResolveForVisitor(organization.Id);
        return await modules.IsOnAsync(ModuleId.PublicWebsite, cancellationToken) ? organization : null;
    }
}
