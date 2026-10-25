using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Attendance;

/// <summary>Builds session summaries: the expected roster is the program's active enrollments plus the session's walk-ins.</summary>
public sealed class SessionReader(IPromiseHubDb db)
{
    public async Task<IReadOnlyList<Guid>> RosterChildIdsAsync(Guid programId, CancellationToken cancellationToken) =>
        await db.Enrollments.AsNoTracking().Where(e => e.ProgramId == programId && e.EndedAt == null).Select(e => e.ChildId).ToListAsync(cancellationToken);

    public async Task<SessionSummaryDto> SummaryAsync(Event e, CancellationToken cancellationToken)
    {
        var program = await db.Programs.AsNoTracking().FirstAsync(p => p.Id == e.ProgramId, cancellationToken);
        var children = await RosterChildIdsAsync(e.ProgramId, cancellationToken);
        var walkIns = await db.WalkIns.AsNoTracking().CountAsync(w => w.EventId == e.Id, cancellationToken);
        var records = await db.AttendanceRecords.AsNoTracking().Where(r => r.EventId == e.Id).ToListAsync(cancellationToken);
        var counted = records.Where(r => r.WalkInId != null || (r.ChildId is { } c && children.Contains(c))).ToList();
        var expected = children.Count + walkIns;
        var checkedIn = counted.Count(r => r.Status is AttendanceStatus.Present or AttendanceStatus.SignedOut);
        var absent = counted.Count(r => r.Status == AttendanceStatus.Absent);
        return new SessionSummaryDto(e.Id, e.Name, program.Id, program.Name, e.StartsAt, e.EndsAt, e.Place, expected, checkedIn, absent,
            expected - checkedIn - absent, e.Status.ToString(), e.EndedAt, e.EndedBy, e.SessionNotes);
    }
}
