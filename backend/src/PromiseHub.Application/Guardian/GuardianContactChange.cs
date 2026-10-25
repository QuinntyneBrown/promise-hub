using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Guardian;

/// <summary>A household's contact changed: every link and trusted device it had stops working (L2-026 criterion 4).</summary>
public sealed class GuardianContactChange(IPromiseHubDb db, TimeProvider clock)
{
    public async Task RevokeAsync(Guid householdId, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        foreach (var link in await db.GuardianLinks.Where(l => l.HouseholdId == householdId && l.RevokedAt == null).ToListAsync(cancellationToken))
        {
            link.Revoke(now);
        }
        foreach (var device in await db.TrustedGuardianDevices.Where(d => d.HouseholdId == householdId && d.RevokedAt == null).ToListAsync(cancellationToken))
        {
            device.Revoke(now);
        }
    }
}
