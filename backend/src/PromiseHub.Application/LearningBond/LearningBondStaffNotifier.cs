using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Notifications;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>Tells the members whose role is in the organization's status roles, in the app (kind learning-bond); the caller saves (L2-142).</summary>
public sealed class LearningBondStaffNotifier(IPromiseHubDb db, NotificationWriter notifications)
{
    public const string Kind = "learning-bond";

    public async Task NotifyAsync(string text, string link, CancellationToken cancellationToken = default)
    {
        var roles = (await db.LearningBondSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken))?.Roles ?? LearningBondSettings.FixedRoles;
        var staff = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null).Select(m => new { m.Id, m.Role }).ToListAsync(cancellationToken);
        await notifications.NotifyMembersAsync(staff.Where(m => roles.Contains(m.Role)).Select(m => m.Id), Kind, text, link, cancellationToken);
    }
}
