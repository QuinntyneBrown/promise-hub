using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Slips;

/// <summary>The families still to answer a slip, with their last reminder and whether they can be reached.</summary>
public sealed class GetUnsignedHandler(IPromiseHubDb db, SlipFamilies families)
{
    public async Task<object?> HandleAsync(Guid slipId, CancellationToken cancellationToken = default)
    {
        var slip = await db.PermissionSlips.AsNoTracking().FirstOrDefaultAsync(s => s.Id == slipId, cancellationToken);
        var e = slip is null ? null : await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == slip.EventId, cancellationToken);
        if (slip is null || e is null)
        {
            return null;
        }
        var reminders = await db.SlipReminders.AsNoTracking().Where(r => r.SlipId == slipId && !r.Unreachable)
            .Select(r => new { r.HouseholdId, r.SentAt }).ToListAsync(cancellationToken);
        var rows = (await families.UnsignedAsync(slip, e, cancellationToken)).Select(f => new UnsignedFamilyDto(
            f.HouseholdId, f.Household, f.Guardian, [.. f.Children.Select(c => c.FirstName)],
            reminders.Where(r => r.HouseholdId == f.HouseholdId).Select(r => (DateTimeOffset?)r.SentAt).Max(), f.Reachable, f.Reason)).ToList();
        return new { households = rows };
    }
}
