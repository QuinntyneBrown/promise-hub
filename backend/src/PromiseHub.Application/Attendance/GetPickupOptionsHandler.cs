using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Attendance;

/// <summary>Lists a child's approved adults for sign-out (L2-020).</summary>
public sealed class GetPickupOptionsHandler(IPromiseHubDb db)
{
    public async Task<PickupOptionsDto?> HandleAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return null;
        }
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == child.HouseholdId).ToListAsync(cancellationToken);
        var ordered = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).ToList();
        var primary = ordered.FirstOrDefault();
        return new PickupOptionsDto(child.Id, child.FullName, primary?.Name, primary?.Mobile,
            [.. ordered.Where(g => g.CanPickUp).Select(g => new ApprovedAdultDto(g.Id, g.Name, g.Relationship, g.IsPrimary))]);
    }
}
