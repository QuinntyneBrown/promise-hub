using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Reports;

/// <summary>
/// Computes the report from enrollments, sessions, check-ins and signatures, so nothing is retyped (L2-024). Counts under
/// <see cref="SmallCount"/> are masked when asked.
/// </summary>
public sealed class ReportCalculator(IPromiseHubDb db, TimeProvider clock)
{
    public const int SmallCount = 5;

    private static readonly (string Band, int Min, int Max)[] Bands = [("Under 6", 0, 5), ("6–8", 6, 8), ("9–11", 9, 11), ("12–13", 12, 13), ("14 and over", 14, 200)];

    public async Task<ReportDto> ComputeAsync(ReportFilter filter, bool mask, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var programs = await db.Programs.AsNoTracking().Where(p => filter.ProgramId == null || p.Id == filter.ProgramId).ToListAsync(cancellationToken);
        var programIds = programs.Select(p => p.Id).ToHashSet();
        var childIds = (await db.Enrollments.AsNoTracking().Where(e => e.EndedAt == null).ToListAsync(cancellationToken))
            .Where(e => programIds.Contains(e.ProgramId)).Select(e => e.ChildId).ToHashSet();
        var children = (await db.Children.AsNoTracking().ToListAsync(cancellationToken)).Where(c => childIds.Contains(c.Id)).ToList();

        var sessions = (await db.Events.AsNoTracking().Where(e => e.Status != EventStatus.Cancelled).ToListAsync(cancellationToken))
            .Where(e => programIds.Contains(e.ProgramId) && e.StartsAt <= now)
            .Where(e => filter.From is null || DateOnly.FromDateTime(e.StartsAt.UtcDateTime) >= filter.From)
            .Where(e => filter.To is null || DateOnly.FromDateTime(e.StartsAt.UtcDateTime) <= filter.To)
            .ToList();
        var sessionIds = sessions.Select(e => e.Id).ToHashSet();
        var records = (await db.AttendanceRecords.AsNoTracking().Where(r => r.ChildId != null).ToListAsync(cancellationToken))
            .Where(r => sessionIds.Contains(r.EventId)).ToList();

        var slips = (await db.PermissionSlips.AsNoTracking().ToListAsync(cancellationToken))
            .Where(s => sessions.Any(e => e.Id == s.EventId) || filter.ProgramId is null).Select(s => s.Id).ToHashSet();
        var signed = (await db.SlipSignatures.AsNoTracking().Where(s => s.Status == SignatureStatus.Signed).ToListAsync(cancellationToken))
            .Count(s => slips.Contains(s.SlipId));

        var households = (await db.Households.AsNoTracking().ToListAsync(cancellationToken))
            .Where(h => children.Any(c => c.HouseholdId == h.Id)).ToList();

        var surveys = (await db.Surveys.AsNoTracking().ToListAsync(cancellationToken)).Where(s => sessionIds.Contains(s.EventId) || (filter.ProgramId is null)).Select(s => s.Id).ToHashSet();
        var ratings = (await db.SurveyResponses.AsNoTracking().ToListAsync(cancellationToken)).Where(r => surveys.Contains(r.SurveyId)).Select(r => r.Rating).ToList();

        string Count(int n) => mask && n > 0 && n < SmallCount ? $"<{SmallCount}" : n.ToString(System.Globalization.CultureInfo.InvariantCulture);

        return new ReportDto(
            children.Count,
            Rate(records) ?? 0,
            sessions.Count,
            signed,
            [.. Bands.Select(b => new AgeBandDto(b.Band, Count(children.Count(c => c.AgeOn(today) is { } a && a >= b.Min && a <= b.Max))))],
            [.. programs.Where(p => p.Status == Domain.Programs.ProgramStatus.Active).OrderBy(p => p.Name)
                .Select(p => new ProgramAttendanceDto(p.Id, p.Name, Rate(records.Where(r => sessions.Any(e => e.Id == r.EventId && e.ProgramId == p.Id)))))],
            [.. households.GroupBy(h => h.Language).OrderByDescending(g => g.Count()).ThenBy(g => g.Key).Select(g => new LanguageCountDto(g.Key, g.Count()))],
            mask,
            ratings.Count,
            ratings.Count == 0 ? null : Math.Round(ratings.Average(), 1));
    }

    private static int? Rate(IEnumerable<AttendanceRecord> records)
    {
        var list = records.ToList();
        var present = list.Count(r => r.Status is AttendanceStatus.Present or AttendanceStatus.SignedOut);
        var absent = list.Count(r => r.Status == AttendanceStatus.Absent);
        return present + absent == 0 ? null : (int)Math.Round(100.0 * present / (present + absent));
    }
}
