using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Builds a child's Quick Card: the red-alert allergy first, medical facts, who to call in order, who may pick up and notes.
/// Medical fields are left out for roles without medical access, and every open is audited (L2-019).
/// </summary>
public sealed class GetQuickCardHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<QuickCardDto?> HandleAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return null;
        }
        var household = await db.Households.AsNoTracking().FirstAsync(h => h.Id == child.HouseholdId, cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == child.HouseholdId).ToListAsync(cancellationToken);
        var programs = await (
            from e in db.Enrollments.AsNoTracking()
            where e.ChildId == childId && e.EndedAt == null
            join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
            orderby p.Name
            select p.Name).ToListAsync(cancellationToken);

        var medicalAllowed = RolePermissions.Has(tenant.Role, Permission.ReadMedical);
        var hasMedical = child.HasMedicalFlag || !string.IsNullOrWhiteSpace(child.Doctor) || !string.IsNullOrWhiteSpace(child.HealthCard);
        var alert = medicalAllowed && child.RedAlert && !string.IsNullOrWhiteSpace(child.Allergies)
            ? new AllergyAlertDto($"Severe allergy: {child.Allergies}", child.AlertInstruction)
            : null;
        var medical = medicalAllowed && hasMedical
            ? new QuickCardMedicalDto(child.Allergies, child.Medication, child.Conditions, child.Doctor, child.HealthCard)
            : null;
        var ordered = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).ToList();

        audit.Record(new AuditEvent(AuditAction.Viewed, "QuickCard", child.Id,
            $"{child.FullName} · Quick Card{(medicalAllowed ? " with medical details" : string.Empty)}"));
        await db.SaveChangesAsync(cancellationToken);

        return new QuickCardDto(
            child.Id,
            household.Id,
            child.FullName,
            child.AgeOn(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime)),
            child.School,
            programs,
            ordered.FirstOrDefault()?.Name,
            household.Language,
            alert,
            medical,
            [.. ordered.Where(g => g.Mobile != null).Select(g => new ContactDto(g.Name, g.Relationship, g.Mobile, g.Language, g.IsPrimary))],
            [.. ordered.Where(g => g.CanPickUp).Select(g => new PickupDto(g.Name, g.Relationship, g.IsPrimary)),
             .. (await db.ApprovedPickups.AsNoTracking().Where(p => p.ChildId == child.Id && p.RemovedAt == null).OrderBy(p => p.Name).ToListAsync(cancellationToken))
                 .Select(p => new PickupDto(p.Name, p.Relationship, false, p.Id))],
            child.Notes,
            !medicalAllowed);
    }
}
