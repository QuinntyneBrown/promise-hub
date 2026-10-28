using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Notifications;

/// <summary>
/// The caller's own notifications (L2-040). Notices of a module that is off are left out, and come back when it is on.
/// </summary>
public sealed class NotificationsHandler(IPromiseHubDb db, ITenantContext tenant, NotificationKinds kinds, TimeProvider clock)
{
    private const int Limit = 50;

    public async Task<NotificationListDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var visible = await VisibleAsync(cancellationToken);
        var mine = (await db.Notifications.AsNoTracking().Where(n => n.MembershipId == tenant.MembershipId).ToListAsync(cancellationToken))
            .Where(n => visible.Contains(n.Kind))
            .OrderByDescending(n => n.CreatedAt)
            .ToList();
        return new NotificationListDto(
            mine.Count(n => n.ReadAt is null),
            [.. mine.Take(Limit).Select(n => new NotificationDto(n.Id, n.Kind, n.Text, n.Link, n.CreatedAt, n.ReadAt))]);
    }

    public async Task<Result> ReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notification = await db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.MembershipId == tenant.MembershipId, cancellationToken);
        if (notification is null)
        {
            return Result.NotFound;
        }
        notification.Read(clock.GetUtcNow());
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ReadAllAsync(CancellationToken cancellationToken = default)
    {
        var visible = await VisibleAsync(cancellationToken);
        var now = clock.GetUtcNow();
        foreach (var n in (await db.Notifications.Where(n => n.MembershipId == tenant.MembershipId && n.ReadAt == null).ToListAsync(cancellationToken)).Where(n => visible.Contains(n.Kind)))
        {
            n.Read(now);
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private Task<HashSet<string>> VisibleAsync(CancellationToken cancellationToken) => kinds.VisibleAsync(cancellationToken);
}
