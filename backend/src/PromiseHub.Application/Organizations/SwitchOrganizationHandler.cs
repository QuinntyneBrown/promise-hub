using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// Lists the person's organizations and switches the active one (L2-002). A person is their memberships with the same
/// email; another person's membership, or a removed one, is not found. The switch is audited in the organization joined.
/// </summary>
public sealed class SwitchOrganizationHandler(IPromiseHubDb db, TenantContext tenant, IAuditWriter audit)
{
    public async Task<MyOrganizationsDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var email = await EmailAsync(cancellationToken);
        var rows = await db.Memberships.IgnoreQueryFilters().AsNoTracking()
            .Where(m => m.Email == email && m.RemovedAt == null && m.DeactivatedAt == null)
            .Join(db.Organizations, m => m.OrganizationId, o => o.Id, (m, o) => new { m.Id, o.Name, m.Role })
            .ToListAsync(cancellationToken);
        return new MyOrganizationsDto([.. rows.OrderBy(r => r.Name).Select(r => new MyOrganizationDto(r.Id, r.Name, r.Role.ToString(), r.Id == tenant.MembershipId))]);
    }

    /// <summary>The membership to continue in, or null when it isn't the caller's.</summary>
    public async Task<Guid?> SwitchAsync(SwitchOrganizationCommand command, CancellationToken cancellationToken = default)
    {
        var email = await EmailAsync(cancellationToken);
        var target = await db.Memberships.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == command.MembershipId && m.Email == email && m.RemovedAt == null && m.DeactivatedAt == null, cancellationToken);
        if (target is null)
        {
            return null;
        }
        tenant.Resolve(target);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == target.OrganizationId, cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Switched, "Membership", target.Id, $"Switched to {organization.Name}"));
        await db.SaveChangesAsync(cancellationToken);
        return target.Id;
    }

    private async Task<string> EmailAsync(CancellationToken cancellationToken) =>
        (await db.Memberships.IgnoreQueryFilters().AsNoTracking().SingleAsync(m => m.Id == tenant.MembershipId, cancellationToken)).Email;
}
