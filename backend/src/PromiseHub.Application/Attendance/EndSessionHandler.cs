using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Ends a session (dialog: end-session; L2-018 criteria 4 and 9): the children not checked in are marked absent or left as
/// not recorded, those still in are signed out at the end time or left unsigned, the session becomes read-only, and each
/// change is audited. Notes (dialog: session-notes) can be saved before or after ending.
/// </summary>
public sealed class EndSessionHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, SessionReader reader, SessionAccess access, TimeProvider clock)
{
    public async Task<(ResultStatus Status, SessionSummaryDto? Summary)> EndAsync(Guid eventId, EndSessionCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return (ResultStatus.NotFound, null);
        }
        if (!await access.AllowsAsync(eventId, cancellationToken))
        {
            return (ResultStatus.Forbidden, null);
        }
        if (e.Status != EventStatus.Scheduled)
        {
            return (ResultStatus.Conflict, null);
        }
        var now = clock.GetUtcNow();
        var roster = await reader.RosterChildIdsAsync(e.ProgramId, cancellationToken);
        var records = await db.AttendanceRecords.Where(r => r.EventId == eventId).ToListAsync(cancellationToken);
        var children = await db.Children.AsNoTracking().Where(c => roster.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.FullName, cancellationToken);
        var walkIns = await db.WalkIns.AsNoTracking().Where(w => w.EventId == eventId).ToDictionaryAsync(w => w.Id, w => w.ChildName, cancellationToken);
        foreach (var childId in roster.Where(id => records.All(r => r.ChildId != id)))
        {
            var record = new AttendanceRecord(Guid.NewGuid(), tenant.OrganizationId, eventId, childId, null);
            db.AttendanceRecords.Add(record);
            records.Add(record);
        }
        var signOutAt = now < e.EndsAt ? now : e.EndsAt;
        foreach (var record in records)
        {
            var name = record.ChildId is { } c ? children.GetValueOrDefault(c) : walkIns.GetValueOrDefault(record.WalkInId ?? Guid.Empty);
            if (name is null)
            {
                continue;
            }
            AttendanceEventKind? kind = null;
            if (record.Status == AttendanceStatus.NotYet && command.NotCheckedIn == NotCheckedInAction.MarkAbsent)
            {
                record.MarkAbsent(now, tenant.ActorName);
                kind = AttendanceEventKind.MarkedAbsent;
            }
            else if (record.Status == AttendanceStatus.Present && command.NotSignedOut == NotSignedOutAction.SignOutAtEnd)
            {
                record.SignOut(signOutAt, "A guardian, at the end of the session", null, false, false, tenant.ActorName);
                kind = AttendanceEventKind.SignedOut;
            }
            if (kind is { } k)
            {
                db.AttendanceEvents.Add(new AttendanceEvent(Guid.NewGuid(), tenant.OrganizationId, record.Id, k, now, tenant.MembershipId, Guid.NewGuid()));
                audit.Record(new AuditEvent(AuditAction.Updated, "Attendance", record.Id, $"{name} · {e.Name} · {k} at end of session"));
            }
        }
        e.End(tenant.ActorName, now);
        audit.Record(new AuditEvent(AuditAction.Updated, "Session", e.Id, $"{e.Name} ended by {tenant.ActorName}", After: command));
        await db.SaveChangesAsync(cancellationToken);
        return (ResultStatus.Done, await reader.SummaryAsync(e, cancellationToken));
    }

    public async Task<Result> SaveNotesAsync(Guid eventId, SessionNotesCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return Result.NotFound;
        }
        if (!await access.AllowsAsync(eventId, cancellationToken))
        {
            return Result.Forbidden;
        }
        e.SaveNotes(command.Notes);
        audit.Record(new AuditEvent(AuditAction.Updated, "Session", e.Id, $"{e.Name} · notes saved"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
