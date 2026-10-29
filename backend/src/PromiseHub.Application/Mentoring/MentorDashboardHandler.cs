using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The mentor dashboard (L2-063): the mentor's youth and cohorts and, while Roll Call is on, how many of their youth were checked in during
/// the last 7 days and the last five attendance changes of their youth at sessions that started in the last 14 days; and his follow-ups from
/// his mentor check-ins (L2-090); and the youth due a mentor check-in under the organization's cadence (L2-125).
/// </summary>
public sealed class MentorDashboardHandler(IPromiseHubDb db, ITenantContext tenant, MentorScope scope, MentoredYouthReader reader, IModuleGate modules,
    OrganizationToday today, TimeProvider clock)
{
    private const int ActivityRows = 5;

    public async Task<MentorDashboardDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var ids = await scope.YouthIdsAsync(cancellationToken);
        var youth = await reader.ReadAsync(ids, cancellationToken);
        var cohorts = await CohortsAsync(cancellationToken);
        var followUps = await FollowUpsAsync(ids, youth, cancellationToken);
        var cadence = await db.Organizations.AsNoTracking().Where(o => o.Id == tenant.OrganizationId).Select(o => o.MentorCheckInDays).SingleAsync(cancellationToken);
        var due = await CheckInsDueAsync(ids, youth, cadence, cancellationToken);
        if (!await modules.IsOnAsync(ModuleId.RollCall, cancellationToken))
        {
            return new MentorDashboardDto(youth, cohorts, null, null, followUps, cadence, due);
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
        return new MentorDashboardDto(youth, cohorts, checkedIn, activity, followUps, cadence, due);
    }

    /// <summary>For each youth, his latest mentor check-in (by date, then when logged) when it has a follow-up date, soonest first (L2-090 criterion 6).</summary>
    private async Task<IReadOnlyList<MentorFollowUpDto>> FollowUpsAsync(IReadOnlyList<Guid> ids, IReadOnlyList<MentoredYouthDto> youth,
        CancellationToken cancellationToken)
    {
        var me = tenant.MembershipId;
        var rows = await db.MentorCheckIns.AsNoTracking().Where(c => c.MentorMembershipId == me && ids.Contains(c.ChildId)).ToListAsync(cancellationToken);
        var now = await today.GetAsync(cancellationToken);
        var names = youth.ToDictionary(y => y.Id, y => y.Name);
        return [.. rows.GroupBy(c => c.ChildId)
            .Select(g => g.OrderByDescending(c => c.Date).ThenByDescending(c => c.CreatedAt).First())
            .Where(c => c.FollowUpOn is not null)
            .OrderBy(c => c.FollowUpOn).ThenBy(c => names[c.ChildId], StringComparer.Ordinal)
            .Select(c => new MentorFollowUpDto(c.ChildId, names[c.ChildId], c.FollowUpOn!.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                c.FollowUpOn < now))];
    }

    /// <summary>
    /// His youth whose latest mentor check-in from him is dated on or before today minus the cadence, or who have none (L2-125 criterion 3):
    /// never-checked-in first, then the oldest, then by name. Another mentor's check-ins never count.
    /// </summary>
    private async Task<IReadOnlyList<MentorCheckInDueDto>> CheckInsDueAsync(IReadOnlyList<Guid> ids, IReadOnlyList<MentoredYouthDto> youth, int cadence,
        CancellationToken cancellationToken)
    {
        var me = tenant.MembershipId;
        var latest = (await db.MentorCheckIns.AsNoTracking().Where(c => c.MentorMembershipId == me && ids.Contains(c.ChildId))
                .Select(c => new { c.ChildId, c.Date }).ToListAsync(cancellationToken))
            .GroupBy(c => c.ChildId).ToDictionary(g => g.Key, g => g.Max(c => c.Date));
        var cutoff = (await today.GetAsync(cancellationToken)).AddDays(-cadence);
        return [.. youth
            .Select(y => new { y.Id, y.Name, Last = latest.TryGetValue(y.Id, out var d) ? d : (DateOnly?)null })
            .Where(y => y.Last is null || y.Last <= cutoff)
            .OrderBy(y => y.Last is null ? 0 : 1).ThenBy(y => y.Last).ThenBy(y => y.Name, StringComparer.Ordinal)
            .Select(y => new MentorCheckInDueDto(y.Id, y.Name, y.Last?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)))];
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
