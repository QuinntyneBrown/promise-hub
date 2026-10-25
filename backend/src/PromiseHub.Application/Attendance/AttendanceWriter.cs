using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Attendance;

/// <summary>Shared rules of every attendance change: the session exists, the caller may run it, it is scheduled, the child is on its roster, and a repeated client action changes nothing.</summary>
public sealed class AttendanceWriter(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, SessionReader reader, SessionAccess access)
{
    public async Task<Result> ApplyAsync(
        Guid eventId,
        Guid childId,
        Guid clientActionId,
        AttendanceEventKind kind,
        DateTimeOffset at,
        Action<AttendanceRecord> change,
        CancellationToken cancellationToken)
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
        if (await db.AttendanceEvents.AnyAsync(x => x.ClientActionId == clientActionId, cancellationToken))
        {
            return Result.Done;
        }
        if (e.Status == EventStatus.Cancelled)
        {
            return Result.Invalid(new Dictionary<string, string> { ["session"] = "This session is cancelled." });
        }
        if (e.Status == EventStatus.Ended)
        {
            return Result.Invalid(new Dictionary<string, string> { ["session"] = "This session has ended." });
        }
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null || !(await reader.RosterChildIdsAsync(e.ProgramId, cancellationToken)).Contains(childId))
        {
            var name = child?.FullName ?? "This child";
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = $"{name} is not on tonight’s roster. Add a walk-in instead." });
        }

        var record = await db.AttendanceRecords.FirstOrDefaultAsync(r => r.EventId == eventId && r.ChildId == childId, cancellationToken);
        if (record is null)
        {
            record = new AttendanceRecord(Guid.NewGuid(), tenant.OrganizationId, eventId, childId, null);
            db.AttendanceRecords.Add(record);
        }
        var before = new { Status = record.Status.ToString(), record.CheckedInAt };
        var hadConflict = record.HasConflict;
        change(record);
        var conflict = record.HasConflict && !hadConflict ? " · conflict: marked absent later on another device, present kept" : "";
        db.AttendanceEvents.Add(new AttendanceEvent(Guid.NewGuid(), tenant.OrganizationId, record.Id, kind, at, tenant.MembershipId, clientActionId));
        audit.Record(new AuditEvent(AuditAction.Updated, "Attendance", record.Id, $"{child.FullName} · {e.Name} · {kind}{conflict}", before,
            new { Status = record.Status.ToString(), record.CheckedInAt }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
