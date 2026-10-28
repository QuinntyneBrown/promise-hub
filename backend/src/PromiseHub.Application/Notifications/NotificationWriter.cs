using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Notifications;

/// <summary>
/// Adds notifications (L2-040, L2-109, ADR 0069): for every current member whose role holds a permission, or for named members, skipping
/// anyone who turned the kind off (L2-111). The caller saves; the save tells the recipients' open streams.
/// </summary>
public sealed class NotificationWriter(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task NotifyAsync(Permission permission, string kind, string text, string link, CancellationToken cancellationToken)
    {
        var memberships = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null).ToListAsync(cancellationToken);
        await NotifyMembersAsync(memberships.Where(m => RolePermissions.Has(m.Role, permission)).Select(m => m.Id), kind, text, link, cancellationToken);
    }

    /// <summary>Adds a notification for each named member of the organization who has not turned the kind off (L2-111).</summary>
    public async Task NotifyMembersAsync(IEnumerable<Guid> membershipIds, string kind, string text, string link, CancellationToken cancellationToken)
    {
        var ids = membershipIds.Distinct().ToList();
        var off = await db.NotificationPreferences.AsNoTracking().Where(p => p.Kind == kind && !p.InApp && ids.Contains(p.MembershipId))
            .Select(p => p.MembershipId).ToListAsync(cancellationToken);
        var now = clock.GetUtcNow();
        foreach (var id in ids.Except(off))
        {
            db.Notifications.Add(new Notification(Guid.NewGuid(), tenant.OrganizationId, id, kind, text, link, now));
        }
    }
}
