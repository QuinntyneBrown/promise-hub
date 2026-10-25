using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Attendance;

/// <summary>Adds a walk-in to this session only, checked in and flagged for enrollment follow-up (L2-017 criterion 4).</summary>
public sealed class AddWalkInHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock, SessionAccess access)
{
    public async Task<Result> HandleAsync(Guid eventId, AddWalkInCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return Result.NotFound;
        }
        if (!await access.AllowsAsync(eventId, cancellationToken))
        {
            return Result.Forbidden;
        }
        var errors = new Dictionary<string, string>();
        if (e.Status == EventStatus.Cancelled)
        {
            errors["session"] = "This session is cancelled.";
        }
        if (string.IsNullOrWhiteSpace(command.ChildName))
        {
            errors["childName"] = "Enter the child’s name.";
        }
        if (string.IsNullOrWhiteSpace(command.Guardian))
        {
            errors["guardian"] = "Enter the guardian’s name and phone.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var now = clock.GetUtcNow();
        var walkIn = new WalkIn(Guid.NewGuid(), tenant.OrganizationId, eventId, command.ChildName.Trim(), command.Guardian.Trim(),
            string.IsNullOrWhiteSpace(command.MedicalNotes) ? null : command.MedicalNotes.Trim());
        var record = new AttendanceRecord(Guid.NewGuid(), tenant.OrganizationId, eventId, null, walkIn.Id);
        record.CheckIn(now, tenant.ActorName);
        db.WalkIns.Add(walkIn);
        db.AttendanceRecords.Add(record);
        db.AttendanceEvents.Add(new AttendanceEvent(Guid.NewGuid(), tenant.OrganizationId, record.Id, AttendanceEventKind.CheckedIn, now, tenant.MembershipId, Guid.NewGuid()));
        audit.Record(new AuditEvent(AuditAction.Created, "WalkIn", walkIn.Id, $"{walkIn.ChildName} · {e.Name}", After: new { walkIn.ChildName, walkIn.Guardian, walkIn.MedicalNotes }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(walkIn.Id);
    }
}
