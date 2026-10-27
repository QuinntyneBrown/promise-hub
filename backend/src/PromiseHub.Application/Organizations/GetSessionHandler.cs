using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;


public sealed class GetSessionHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate gate)
{
    public async Task<SessionDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var modules = await gate.OnAsync(cancellationToken);
        return new SessionDto(
            tenant.ActorName,
            tenant.Role.ToString(),
            organization.Id,
            organization.Name,
            organization.Plan.ToString(),
            [.. ModuleCatalog.All.Where(modules.Contains).Select(m => m.ToString())],
            tenant.MembershipId);
    }
}
