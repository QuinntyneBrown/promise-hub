using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>Whether the caller's role is in the organization's status roles (L2-138 criterion 4, L2-142 criterion 5); Admin and Program director always are.</summary>
public sealed class LearningBondStatusRoles(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<bool> SeesStatusAsync(CancellationToken cancellationToken = default)
    {
        var roles = (await db.LearningBondSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken))?.Roles ?? LearningBondSettings.FixedRoles;
        return roles.Contains(tenant.Role);
    }
}
