using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Households;

public sealed class GetChildHandler(IPromiseHubDb db, IAuditWriter audit, ITenantContext tenant, TimeProvider clock, RosterAccess access)
{
    /// <summary>
    /// Returns the child of the current organization. A child of another organization is not found, and a child outside
    /// a youth worker's sessions is forbidden; both attempts are audited.
    /// </summary>
    public async Task<(ResultStatus Status, ChildDto? Child)> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (child is null)
        {
            if (await db.Children.IgnoreQueryFilters().AnyAsync(c => c.Id == id && c.OrganizationId != tenant.OrganizationId, cancellationToken))
            {
                audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", id, "Requested a child of another organization"));
                await db.SaveChangesAsync(cancellationToken);
            }
            return (ResultStatus.NotFound, null);
        }
        if (await access.PermittedChildrenAsync(cancellationToken) is { } permitted && !permitted.Contains(child.Id))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", child.Id, $"{child.FullName} · outside the caller's sessions"));
            await db.SaveChangesAsync(cancellationToken);
            return (ResultStatus.Forbidden, null);
        }

        var household = await db.Households.AsNoTracking().FirstAsync(h => h.Id == child.HouseholdId, cancellationToken);
        var medical = RolePermissions.Has(tenant.Role, Permission.ReadMedical);
        if (medical)
        {
            // Every view of medical details is recorded (L2-032 criterion 2).
            audit.Record(new AuditEvent(AuditAction.Viewed, "ChildMedical", child.Id, $"{child.FullName} · medical details"));
            await db.SaveChangesAsync(cancellationToken);
        }
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var contacts = RolePermissions.Has(tenant.Role, Permission.ReadContacts);
        return (ResultStatus.Done, new ChildDto(
            child.Id,
            child.FullName,
            child.FirstName,
            child.LastName,
            contacts ? child.DateOfBirth : null,
            child.AgeOn(today),
            child.School,
            household.Id,
            household.Name,
            medical
                ? new MedicalDto(child.Allergies, child.Medication, child.Conditions, child.Doctor, child.RedAlert, child.AlertInstruction, child.HealthCard, child.MedicalUpdatedAt, child.MedicalUpdatedBy)
                : null,
            !medical));
    }
}
