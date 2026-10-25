using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;

namespace PromiseHub.Application.Households;

/// <summary>Replaces a child's medical details; the entry records the editor, the time and both versions (L2-011 criterion 2).</summary>
public sealed class UpdateMedicalHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid id, MedicalDetails details, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (child is null)
        {
            return Result.NotFound;
        }
        var before = child.Medical;
        child.UpdateMedical(Trim(details), tenant.ActorName, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, "ChildMedical", child.Id, $"{child.FullName} · medical details", before, child.Medical));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private static MedicalDetails Trim(MedicalDetails d) => new(
        string.IsNullOrWhiteSpace(d.Allergies) ? null : d.Allergies.Trim(),
        string.IsNullOrWhiteSpace(d.Medication) ? null : d.Medication.Trim(),
        string.IsNullOrWhiteSpace(d.Conditions) ? null : d.Conditions.Trim(),
        string.IsNullOrWhiteSpace(d.Doctor) ? null : d.Doctor.Trim(),
        d.RedAlert,
        string.IsNullOrWhiteSpace(d.AlertInstruction) ? null : d.AlertInstruction.Trim());
}
