using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// An admin or program director corrects a youth's mark at a session that has started and was not cancelled, ended or not
/// (L2-097 criteria 4 to 6). Audited with the mark before and after and the reason; appends a Corrected attendance event.
/// </summary>
public sealed class CorrectAttendanceHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, SessionReader reader, TimeProvider clock)
{
    public const int MaximumReason = 500;

    public async Task<Result> HandleAsync(Guid eventId, Guid childId, CorrectAttendanceRequest request, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return Result.NotFound;
        }
        var errors = new Dictionary<string, string>();
        if (!Enum.TryParse<AttendanceMark>(request.Status, ignoreCase: false, out var mark) || !Enum.IsDefined(mark))
        {
            errors["status"] = "Choose a mark.";
        }
        var reason = request.Reason?.Trim() ?? "";
        if (reason.Length == 0)
        {
            errors["reason"] = "Say why you’re correcting it.";
        }
        else if (reason.Length > MaximumReason)
        {
            errors["reason"] = "Keep it to 500 characters.";
        }
        var now = clock.GetUtcNow();
        if (e.Status == EventStatus.Cancelled)
        {
            errors["session"] = "This session is cancelled.";
        }
        else if (e.StartsAt > now)
        {
            errors["session"] = "This session hasn’t started yet.";
        }
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        var record = await db.AttendanceRecords.FirstOrDefaultAsync(r => r.EventId == eventId && r.ChildId == childId, cancellationToken);
        if (child is null || (record is null && !(await reader.RosterChildIdsAsync(e.ProgramId, cancellationToken)).Contains(childId)))
        {
            errors["childId"] = $"{child?.FullName ?? "This child"} is not on this cohort’s roster.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        if (record is null)
        {
            record = new AttendanceRecord(Guid.NewGuid(), tenant.OrganizationId, eventId, childId, null);
            db.AttendanceRecords.Add(record);
        }
        var before = AttendanceMarks.Of(record)?.ToString() ?? "Not recorded";
        record.Correct(mark, e.StartsAt, now, tenant.ActorName);
        db.AttendanceEvents.Add(new AttendanceEvent(Guid.NewGuid(), tenant.OrganizationId, record.Id, AttendanceEventKind.Corrected, now, tenant.MembershipId, Guid.NewGuid()));
        audit.Record(new AuditEvent(AuditAction.Updated, "Attendance", record.Id,
            $"Correction · {child!.FullName} · {e.Name} · {before} → {mark} · {reason}", new { Mark = before }, new { Mark = mark.ToString(), Reason = reason }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
