using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The mentor dashboard (L2-063): the mentor's youth and cohorts and, while Roll Call is on, how many of their youth were checked in during
/// the last 7 days and the last five attendance changes of their youth at sessions that started in the last 14 days.
/// </summary>
public sealed class MentorDashboardHandler(IPromiseHubDb db, MentorScope scope, MentoredYouthReader reader, IModuleGate modules, TimeProvider clock)
{
    private const int ActivityRows = 5;

    public async Task<MentorDashboardDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var ids = await scope.YouthIdsAsync(cancellationToken);
        var youth = await reader.ReadAsync(ids, cancellationToken);
        var cohorts = await CohortsAsync(cancellationToken);
        if (!await modules.IsOnAsync(ModuleId.RollCall, cancellationToken))
        {
            return new MentorDashboardDto(youth, cohorts, null, null);
        }
        var now = clock.GetUtcNow();
        var since = now.AddDays(-14);
        var rows = await (
            from r in db.AttendanceRecords.AsNoTracking()
            where r.ChildId != null && ids.Contains(r.ChildId.Value) && r.Status != AttendanceStatus.NotYet
            join e in db.Events.AsNoTracking() on r.EventId equals e.Id
            select new { ChildId = r.ChildId!.Value, r.Status, r.CheckedInAt, r.SignedOutAt, Session = e.Name, e.StartsAt })
            .ToListAsync(cancellationToken);
        rows = [.. rows.Where(r => r.StartsAt >= since && r.StartsAt <= now)];
        var weekAgo = now.AddDays(-7);
        var checkedIn = rows.Where(r => r.Status != AttendanceStatus.Absent && r.StartsAt >= weekAgo).Select(r => r.ChildId).Distinct().Count();
        var names = youth.ToDictionary(y => y.Id, y => y.Name);
        var activity = rows
            .Select(r => r.Status switch
            {
                AttendanceStatus.SignedOut => new MentorActivityDto(r.ChildId, names[r.ChildId], "SignedOut", r.Session, r.SignedOutAt ?? r.StartsAt),
                AttendanceStatus.Absent => new MentorActivityDto(r.ChildId, names[r.ChildId], "Absent", r.Session, r.StartsAt),
                _ => new MentorActivityDto(r.ChildId, names[r.ChildId], "CheckedIn", r.Session, r.CheckedInAt ?? r.StartsAt),
            })
            .OrderByDescending(a => a.At).Take(ActivityRows).ToList();
        return new MentorDashboardDto(youth, cohorts, checkedIn, activity);
    }

    private async Task<IReadOnlyList<MentorCohortSummaryDto>> CohortsAsync(CancellationToken cancellationToken)
    {
        var mine = await scope.CohortsAsync(cancellationToken);
        var ids = mine.Select(c => c.ProgramId).ToList();
        var programs = await db.Programs.AsNoTracking().Where(p => ids.Contains(p.Id)).ToListAsync(cancellationToken);
        var counts = await db.Enrollments.AsNoTracking().Where(e => ids.Contains(e.ProgramId) && e.EndedAt == null)
            .GroupBy(e => e.ProgramId).Select(g => new { g.Key, Count = g.Count() }).ToDictionaryAsync(g => g.Key, g => g.Count, cancellationToken);
        return [.. programs.OrderBy(p => p.Name)
            .Select(p => new MentorCohortSummaryDto(p.Id, p.Name, p.Term, mine.First(c => c.ProgramId == p.Id).IsLead ? "Lead" : "Supporting",
                counts.GetValueOrDefault(p.Id)))];
    }
}
