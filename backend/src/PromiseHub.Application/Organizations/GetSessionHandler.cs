using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;


public sealed class GetSessionHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate gate, DisplayPreferencesHandler display,
    LearningBond.LearningBondStatusRoles learningBond)
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
            tenant.MembershipId,
            await display.GetAsync(cancellationToken),
            // Whether Learning Bond's covered households are this member's to see (L2-142 criterion 5): navigation shows them only then.
            modules.Contains(ModuleId.LearningBond) && await learningBond.SeesStatusAsync(cancellationToken));
    }
}
