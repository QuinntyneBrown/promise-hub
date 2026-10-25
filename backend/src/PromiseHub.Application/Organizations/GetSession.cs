using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Organizations;

public sealed record SessionDto(string PersonName, string Role, Guid OrganizationId, string OrganizationName, string Plan);

public sealed class GetSessionHandler(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<SessionDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        return new SessionDto(tenant.ActorName, tenant.Role.ToString(), organization.Id, organization.Name, organization.Plan.ToString());
    }
}
