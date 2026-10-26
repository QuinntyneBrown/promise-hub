using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Identity;

/// <summary>The membership a new session starts in, or a session falls back to: the first current organization by name.</summary>
public static class ActiveMembership
{
    public static Task<Membership?> ForAsync(IPromiseHubDb db, string email, CancellationToken cancellationToken) =>
        db.Memberships.IgnoreQueryFilters()
            .Where(m => m.Email == email && m.RemovedAt == null)
            .Join(db.Organizations, m => m.OrganizationId, o => o.Id, (m, o) => new { Membership = m, o.Name })
            .OrderBy(x => x.Name)
            .Select(x => x.Membership)
            .FirstOrDefaultAsync(cancellationToken);
}
