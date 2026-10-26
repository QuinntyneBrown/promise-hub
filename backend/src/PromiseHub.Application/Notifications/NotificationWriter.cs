using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Notifications;

/// <summary>Adds a notification for every current staff member whose role holds the permission. The caller saves.</summary>
public sealed class NotificationWriter(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task NotifyAsync(Permission permission, string kind, string text, string link, CancellationToken cancellationToken)
    {
        var memberships = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null).ToListAsync(cancellationToken);
        foreach (var m in memberships.Where(m => RolePermissions.Has(m.Role, permission)))
        {
            db.Notifications.Add(new Notification(Guid.NewGuid(), tenant.OrganizationId, m.Id, kind, text, link, clock.GetUtcNow()));
        }
    }
}
