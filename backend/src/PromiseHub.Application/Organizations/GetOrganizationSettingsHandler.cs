using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Organizations;

public sealed class GetOrganizationSettingsHandler(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<OrganizationSettingsDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        return new OrganizationSettingsDto(organization.Name, organization.City, organization.Plan.ToString());
    }
}
