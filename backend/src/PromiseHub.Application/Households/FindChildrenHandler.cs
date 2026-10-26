using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Households;

/// <summary>Children of the organization whose name contains the text, for pickers such as enrolling in a program.</summary>
public sealed class FindChildrenHandler(IPromiseHubDb db, TimeProvider clock, RosterAccess access)
{
    public async Task<ChildMatchesDto> HandleAsync(string? q, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return new ChildMatchesDto([]);
        }
        var permitted = await access.PermittedChildrenAsync(cancellationToken);
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var rows = await (
            from c in db.Children.AsNoTracking()
            join h in db.Households.AsNoTracking() on c.HouseholdId equals h.Id
            select new { Child = c, Household = h.Name }).ToListAsync(cancellationToken);
        return new ChildMatchesDto([.. rows
            .Where(r => permitted is null || permitted.Contains(r.Child.Id))
            .Where(r => r.Child.FullName.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
            .OrderBy(r => r.Child.FirstName).ThenBy(r => r.Child.LastName)
            .Take(10)
            .Select(r => new ChildMatchDto(r.Child.Id, r.Child.FullName, r.Child.AgeOn(today), r.Child.HouseholdId, r.Household))]);
    }
}
