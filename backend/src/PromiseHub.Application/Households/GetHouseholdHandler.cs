using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Households;

public sealed class GetHouseholdHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, IAuditWriter audit, RosterAccess access)
{
    public async Task<(ResultStatus Status, HouseholdDto? Household)> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var household = await db.Households.AsNoTracking().FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
        if (household is null)
        {
            return (ResultStatus.NotFound, null);
        }
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var medical = RolePermissions.Has(tenant.Role, Permission.ReadMedical);
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == id).ToListAsync(cancellationToken);
        var children = await db.Children.AsNoTracking().Where(c => c.HouseholdId == id).ToListAsync(cancellationToken);
        if (await access.PermittedChildrenAsync(cancellationToken) is { } permitted)
        {
            // A youth worker sees only their children, and a household with none of them is forbidden (L2-007 criterion 7).
            children = [.. children.Where(c => permitted.Contains(c.Id))];
            if (children.Count == 0)
            {
                audit.Record(new AuditEvent(AuditAction.AccessDenied, "Household", household.Id, $"{household.Name} · outside the caller's sessions"));
                await db.SaveChangesAsync(cancellationToken);
                return (ResultStatus.Forbidden, null);
            }
        }
        return (ResultStatus.Done, new HouseholdDto(
            household.Id,
            household.Name,
            household.Language,
            [.. guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name)
                .Select(g => new GuardianDto(g.Id, g.Name, g.Relationship, g.Mobile, g.Email, g.Language, g.IsPrimary, g.CanPickUp, g.CanSign))],
            [.. children.OrderBy(c => c.AgeOn(today) ?? 99)
                .Select(c => new ChildSummaryDto(c.Id, c.FullName, c.AgeOn(today), c.School, medical ? Flag(c) : null))],
            !medical));
    }

    private static string? Flag(Domain.Households.Child child) =>
        !string.IsNullOrWhiteSpace(child.Allergies) ? "Allergy"
        : !string.IsNullOrWhiteSpace(child.Medication) ? "Medication"
        : !string.IsNullOrWhiteSpace(child.Conditions) ? child.Conditions
        : null;
}
