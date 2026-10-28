using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// A cohort's attendance by session and by youth (L2-097): staff choose any active program, a mentor only the cohorts on his team.
/// Sessions are those that have started and were not cancelled, newest first.
/// </summary>
public sealed class AttendanceHistoryHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    private const double Threshold = 0.7;

    public async Task<(ResultStatus Status, AttendanceHistoryDto? History)> HandleAsync(Guid? programId, CancellationToken cancellationToken = default)
    {
        var active = db.Programs.AsNoTracking().Where(p => p.Status != ProgramStatus.Archived);
        if (tenant.Role == Role.Mentor)
        {
            var me = tenant.MembershipId;
            var team = db.CohortMentors.Where(t => t.MentorMembershipId == me).Select(t => t.ProgramId);
            active = active.Where(p => team.Contains(p.Id));
        }
        var cohorts = (await active.Select(p => new CohortOptionDto(p.Id, p.Name)).ToListAsync(cancellationToken))
            .OrderBy(c => c.Name, StringComparer.CurrentCulture).ToList();
        var canCorrect = RolePermissions.Has(tenant.Role, Permission.CorrectAttendance);

        Guid? chosen = programId ?? cohorts.FirstOrDefault()?.Id;
        if (chosen is not { } id)
        {
            return (ResultStatus.Done, new AttendanceHistoryDto(cohorts, null, null, null, null, 0, 0, 0, canCorrect, [], []));
        }
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (program is null)
        {
            return (ResultStatus.NotFound, null);
        }
        if (cohorts.All(c => c.Id != id))
        {
            if (tenant.Role == Role.Mentor)
            {
                audit.Record(new AuditEvent(AuditAction.AccessDenied, "Program", id, $"{program.Name} · attendance history, not on the mentor’s team"));
                await db.SaveChangesAsync(cancellationToken);
                return (ResultStatus.Forbidden, null);
            }
            if (program.Status == ProgramStatus.Archived)
            {
                return (ResultStatus.NotFound, null);
            }
        }

        var now = clock.GetUtcNow();
        var events = (await db.Events.AsNoTracking().Where(e => e.ProgramId == id && e.Status != EventStatus.Cancelled).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt <= now)
            .OrderByDescending(e => e.StartsAt)
            .ToList();
        var eventIds = events.Select(e => e.Id).ToList();
        var records = await db.AttendanceRecords.AsNoTracking().Where(r => eventIds.Contains(r.EventId) && r.ChildId != null).ToListAsync(cancellationToken);
        var rosterIds = await db.Enrollments.AsNoTracking().Where(e => e.ProgramId == id && e.EndedAt == null).Select(e => e.ChildId).ToListAsync(cancellationToken);
        var roster = await db.Children.AsNoTracking().Where(c => rosterIds.Contains(c.Id)).ToListAsync(cancellationToken);
        var marks = records.Select(r => (r.EventId, ChildId: r.ChildId!.Value, Mark: AttendanceMarks.Of(r))).Where(m => m.Mark is not null)
            .Select(m => (m.EventId, m.ChildId, Mark: m.Mark!.Value)).ToList();

        var sessions = events.Select(e =>
        {
            var mine = marks.Where(m => m.EventId == e.Id).Select(m => m.Mark).ToList();
            var marked = mine.Count;
            var status = e.Status != EventStatus.Ended && now < e.EndsAt ? "InProgress"
                : marked == 0 ? "NotRecorded"
                : e.Status == EventStatus.Ended || marked >= rosterIds.Count ? "Recorded"
                : "NeedsReview";
            return new SessionAttendanceDto(e.Id, e.Name, e.StartsAt, Count(mine, AttendanceMark.Present), Count(mine, AttendanceMark.Late),
                Count(mine, AttendanceMark.Excused), Count(mine, AttendanceMark.Absent), AttendanceMarks.Rate(mine.Count(AttendanceMarks.Attended), marked), status);
        }).ToList();

        var youth = roster.Select(c =>
        {
            var mine = marks.Where(m => m.ChildId == c.Id).Select(m => m.Mark).ToList();
            var attended = mine.Count(AttendanceMarks.Attended);
            return new YouthAttendanceDto(c.Id, c.FullName, attended, mine.Count, Count(mine, AttendanceMark.Late), Count(mine, AttendanceMark.Excused),
                Count(mine, AttendanceMark.Absent), AttendanceMarks.Rate(attended, mine.Count), mine.Count > 0 && attended < Threshold * mine.Count);
        }).OrderBy(y => y.Name, StringComparer.CurrentCulture).ToList();

        var allAttended = marks.Count(m => AttendanceMarks.Attended(m.Mark));
        return (ResultStatus.Done, new AttendanceHistoryDto(cohorts, program.Id, program.Name, program.Schedule, AttendanceMarks.Rate(allAttended, marks.Count),
            sessions.Count(s => s.Present + s.Late + s.Excused + s.Absent > 0), sessions.Count, youth.Count(y => y.BelowThreshold), canCorrect, sessions, youth));
    }

    private static int Count(IEnumerable<AttendanceMark> marks, AttendanceMark mark) => marks.Count(m => m == mark);
}
