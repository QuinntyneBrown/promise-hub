using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Which sessions the caller may open and run. Roles that run sessions without <see cref="Permission.RunAnySession"/>
/// (youth workers) are limited to the sessions they are assigned to; everyone else is unrestricted (L2-007 criterion 6).
/// </summary>
public sealed class SessionAccess(IPromiseHubDb db, ITenantContext tenant)
{
    public bool Scoped => RolePermissions.Has(tenant.Role, Permission.RunSessions) && !RolePermissions.Has(tenant.Role, Permission.RunAnySession);

    public async Task<bool> AllowsAsync(Guid eventId, CancellationToken cancellationToken) =>
        !Scoped || await db.SessionStaff.AnyAsync(s => s.EventId == eventId && s.MembershipId == tenant.MembershipId, cancellationToken);

    public async Task<HashSet<Guid>?> AssignedAsync(CancellationToken cancellationToken) =>
        Scoped
            ? [.. await db.SessionStaff.Where(s => s.MembershipId == tenant.MembershipId).Select(s => s.EventId).ToListAsync(cancellationToken)]
            : null;
}
