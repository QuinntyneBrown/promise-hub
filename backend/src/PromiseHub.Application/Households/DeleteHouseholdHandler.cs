using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Households;

/// <summary>Soft-deletes a household with its guardians and children once its name is typed; they are purged after the retention period.</summary>
public sealed class DeleteHouseholdHandler(IPromiseHubDb db, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid id, DeleteHouseholdCommand command, CancellationToken cancellationToken = default)
    {
        var household = await db.Households.FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
        if (household is null)
        {
            return Result.NotFound;
        }
        if (!string.Equals(command.ConfirmName?.Trim(), household.Name, StringComparison.OrdinalIgnoreCase))
        {
            return Result.Invalid(new Dictionary<string, string> { ["confirmName"] = $"Type {household.Name} to confirm." });
        }
        var now = clock.GetUtcNow();
        household.SoftDelete(now, HouseholdRules.Retention);
        foreach (var guardian in await db.Guardians.Where(g => g.HouseholdId == id).ToListAsync(cancellationToken))
        {
            guardian.SoftDelete(now);
        }
        foreach (var child in await db.Children.Where(c => c.HouseholdId == id).ToListAsync(cancellationToken))
        {
            child.SoftDelete(now);
        }
        audit.Record(new AuditEvent(AuditAction.Deleted, "Household", household.Id, $"{household.Name} household · {command.Reason}",
            Before: new { household.Name }, After: new { household.DeletedAt, household.PurgeAfter, command.Reason }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
