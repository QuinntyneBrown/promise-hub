using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Attendance;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Reports;

/// <summary>
/// The detailed reports (L2-127, L2-128, L2-131, ADR 0074), computed on read inside the tenant filter. A section whose module is off is null.
/// </summary>
public sealed class DetailedReportsHandler(IPromiseHubDb db, LearnerProgress progress, IModuleGate modules, Mentoring.OrganizationToday today, TimeProvider clock)
{
    /// <summary>The cohort report of one program of the organization, or null when there is no such program.</summary>
    public async Task<CohortReportDto?> CohortAsync(Guid programId, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return null;
        }
        var on = await modules.OnAsync(cancellationToken);
        var learningOn = on.Contains(ModuleId.Learning);
        var mentoringOn = on.Contains(ModuleId.Mentoring);
        var rollCallOn = on.Contains(ModuleId.RollCall);

        var cohort = await CohortFactsAsync(program, learningOn, cancellationToken);
        var children = await db.Children.AsNoTracking().Where(c => cohort.Enrollments.Select(e => e.ChildId).Contains(c.Id)).ToListAsync(cancellationToken);
        var flagged = mentoringOn
            ? (await db.AtRiskFlags.AsNoTracking().Where(f => f.ResolvedAt == null).Select(f => f.ChildId).ToListAsync(cancellationToken)).ToHashSet()
            : [];
        var checkIns = mentoringOn
            ? (await db.MentorCheckIns.AsNoTracking().Where(c => c.Date >= program.StartsOn).Select(c => c.ChildId).ToListAsync(cancellationToken))
                .GroupBy(id => id).ToDictionary(g => g.Key, g => g.Count())
            : [];

        var youth = children.OrderBy(c => c.FullName, StringComparer.CurrentCulture).Select(c =>
        {
            var active = cohort.Enrollments.Any(e => e.ChildId == c.Id && e.EndedAt == null);
            var status = !active ? "Ended" : flagged.Contains(c.Id) ? "AtRisk" : "OnTrack";
            cohort.Learning.TryGetValue(c.Id, out var learning);
            return new CohortYouthDto(c.Id, c.FullName, cohort.Accounts.ContainsKey(c.Id), learningOn ? learning?.Completion : null,
                rollCallOn ? Rate(cohort.Records.Where(r => r.ChildId == c.Id)) : null,
                mentoringOn ? checkIns.GetValueOrDefault(c.Id) : null, status);
        }).ToList();

        var activeIds = cohort.Enrollments.Where(e => e.EndedAt == null).Select(e => e.ChildId).ToHashSet();
        CohortLearningDto? learningSection = null;
        if (learningOn)
        {
            var mine = cohort.Learning.Where(l => activeIds.Contains(l.Key)).Select(l => l.Value).ToList();
            learningSection = new CohortLearningDto(
                Average(mine.Select(l => l.Completion)),
                [.. cohort.Modules.Select(m => new ModuleCompletionDto(m.Id, m.Title,
                    Average(mine.Select(l => l.Modules.GetValueOrDefault(m.Id))) ?? 0))]);
        }

        return new CohortReportDto(program.Id, program.Name, cohort.TrackName,
            cohort.Enrollments.Count(e => e.EndedAt == null), cohort.Enrollments.Count(e => e.EndedAt != null), Retention(cohort.Enrollments),
            rollCallOn ? Rate(cohort.Records) : null,
            learningSection,
            mentoringOn ? youth.Count(y => y.Status == "AtRisk") : null,
            await ComparisonAsync(learningOn, rollCallOn, cancellationToken),
            youth);
    }

    /// <summary>The youth report of one child of the organization, or null when there is no such child (L2-127 criterion 3).</summary>
    public async Task<YouthReportDto?> YouthAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return null;
        }
        var on = await modules.OnAsync(cancellationToken);
        var programs = await (from e in db.Enrollments.AsNoTracking()
                              join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                              where e.ChildId == childId && e.EndedAt == null && p.Status == ProgramStatus.Active
                              orderby p.Name
                              select p.Name).ToListAsync(cancellationToken);
        var account = await db.Memberships.AsNoTracking()
            .Where(m => m.ChildId == childId && m.Role == Role.Youth && m.RemovedAt == null).Select(m => (Guid?)m.Id).FirstOrDefaultAsync(cancellationToken);

        YouthLearningDto? learning = null;
        if (on.Contains(ModuleId.Learning) && account is { } membershipId)
        {
            var tracks = await progress.ForMembership(membershipId).TracksAsync(cancellationToken);
            var quizzes = tracks.SelectMany(t => t.Modules).SelectMany(m => m.Quizzes).Where(q => q.BestScore is not null)
                .Select(q => new YouthQuizDto(q.Quiz.Id, q.Quiz.Title, q.BestScore!.Value)).ToList();
            var badges = await (from a in db.BadgeAwards.AsNoTracking()
                                join b in db.Badges.AsNoTracking() on a.BadgeId equals b.Id
                                where a.MembershipId == membershipId
                                orderby a.AwardedAt
                                select b.Name).ToListAsync(cancellationToken);
            var done = tracks.Sum(t => t.Done);
            var total = tracks.Sum(t => t.Total);
            learning = new YouthLearningDto(done, total, Percent(done, total), Average(quizzes.Select(q => (int?)q.BestScore)),
                [.. tracks.SelectMany(t => t.Modules).Select(m => new YouthModuleDto(m.Module.Id, m.Module.Title, m.Done, m.Lessons.Count, ModuleState(m)))],
                quizzes, badges);
        }

        YouthAttendanceSummaryDto? attendance = null;
        if (on.Contains(ModuleId.RollCall))
        {
            var marks = (await db.AttendanceRecords.AsNoTracking().Where(r => r.ChildId == childId).ToListAsync(cancellationToken))
                .Select(AttendanceMarks.Of).Where(m => m is not null).Select(m => m!.Value).ToList();
            attendance = new YouthAttendanceSummaryDto(marks.Count(m => m == AttendanceMark.Present), marks.Count(m => m == AttendanceMark.Late),
                marks.Count(m => m == AttendanceMark.Excused), marks.Count(m => m == AttendanceMark.Absent),
                AttendanceMarks.Rate(marks.Count(AttendanceMarks.Attended), marks.Count));
        }

        YouthMentoringDto? mentoring = null;
        if (on.Contains(ModuleId.Mentoring))
        {
            var mentor = await (from y in db.YouthMentors.AsNoTracking()
                                join m in db.Memberships.AsNoTracking() on y.MentorMembershipId equals m.Id
                                where y.ChildId == childId
                                select m.PersonName).FirstOrDefaultAsync(cancellationToken);
            var checkIns = await db.MentorCheckIns.AsNoTracking().Where(c => c.ChildId == childId)
                .Select(c => new { c.Date, c.Engagement, c.CreatedAt }).ToListAsync(cancellationToken);
            var latest = checkIns.OrderByDescending(c => c.Date).ThenByDescending(c => c.CreatedAt).FirstOrDefault();
            mentoring = new YouthMentoringDto(mentor, checkIns.Count, latest?.Date, latest?.Engagement.ToString(),
                await db.AtRiskFlags.AsNoTracking().AnyAsync(f => f.ChildId == childId && f.ResolvedAt == null, cancellationToken));
        }

        return new YouthReportDto(child.Id, child.FullName, child.AgeOn(await today.GetAsync(cancellationToken)), programs, account is not null,
            learning, attendance, mentoring);
    }

    /// <summary>Done when every lesson is done and every required quiz passed, InProgress with some lessons done, else NotStarted.</summary>
    private static string ModuleState(ModuleStatus module) =>
        module.Lessons.Count > 0 && module.Complete ? "Done" : module.Done > 0 ? "InProgress" : "NotStarted";

    /// <summary>Attendance, retention and average completion across every active program of the organization.</summary>
    private async Task<CohortComparisonDto> ComparisonAsync(bool learningOn, bool rollCallOn, CancellationToken cancellationToken)
    {
        var programs = await db.Programs.AsNoTracking().Where(p => p.Status == ProgramStatus.Active).ToListAsync(cancellationToken);
        var enrollments = new List<Domain.Programs.Enrollment>();
        var records = new List<AttendanceRecord>();
        var completions = new List<int?>();
        foreach (var program in programs)
        {
            var facts = await CohortFactsAsync(program, learningOn, cancellationToken);
            enrollments.AddRange(facts.Enrollments);
            records.AddRange(facts.Records);
            var active = facts.Enrollments.Where(e => e.EndedAt == null).Select(e => e.ChildId).ToHashSet();
            completions.AddRange(facts.Learning.Where(l => active.Contains(l.Key)).Select(l => l.Value.Completion));
        }
        return new CohortComparisonDto(rollCallOn ? Rate(records) : null, Retention(enrollments), learningOn ? Average(completions) : null);
    }

    /// <summary>What a program's report is computed from: its enrollments, the marked records of its past sessions, its track's modules and each youth's learning.</summary>
    private async Task<CohortFacts> CohortFactsAsync(Domain.Programs.Program program, bool learningOn, CancellationToken cancellationToken)
    {
        var enrollments = await db.Enrollments.AsNoTracking().Where(e => e.ProgramId == program.Id).ToListAsync(cancellationToken);
        var now = clock.GetUtcNow();
        var sessionIds = (await db.Events.AsNoTracking().Where(e => e.ProgramId == program.Id && e.Status != EventStatus.Cancelled).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt <= now).Select(e => e.Id).ToHashSet();
        var records = (await db.AttendanceRecords.AsNoTracking().Where(r => r.ChildId != null).ToListAsync(cancellationToken))
            .Where(r => sessionIds.Contains(r.EventId) && AttendanceMarks.Of(r) is not null).ToList();
        var childIds = enrollments.Select(e => e.ChildId).ToHashSet();
        var accounts = (await db.Memberships.AsNoTracking().Where(m => m.Role == Role.Youth && m.RemovedAt == null && m.ChildId != null).ToListAsync(cancellationToken))
            .Where(m => childIds.Contains(m.ChildId!.Value)).GroupBy(m => m.ChildId!.Value).ToDictionary(g => g.Key, g => g.First().Id);

        var track = program.TrackId is { } trackId
            ? await db.Tracks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == trackId && t.Status == ContentStatus.Published, cancellationToken)
            : null;
        var trackModules = track is null
            ? []
            : await db.CurriculumModules.AsNoTracking().Where(m => m.TrackId == track.Id && m.Status == ContentStatus.Published)
                .OrderBy(m => m.Position).ToListAsync(cancellationToken);
        var learning = new Dictionary<Guid, YouthLearning>();
        if (learningOn && track is not null)
        {
            foreach (var (childId, membershipId) in accounts)
            {
                var status = (await progress.ForMembership(membershipId).TracksAsync(cancellationToken)).FirstOrDefault(t => t.Track.Id == track.Id);
                if (status is not null)
                {
                    learning[childId] = new YouthLearning(Percent(status.Done, status.Total),
                        status.Modules.ToDictionary(m => m.Module.Id, m => (int?)(Percent(m.Done, m.Lessons.Count) ?? 0)), status);
                }
            }
        }
        return new CohortFacts(enrollments, records, accounts, track?.Name, trackModules, learning);
    }

    private static int? Rate(IEnumerable<AttendanceRecord> records)
    {
        var marks = records.Select(AttendanceMarks.Of).Where(m => m is not null).Select(m => m!.Value).ToList();
        return AttendanceMarks.Rate(marks.Count(AttendanceMarks.Attended), marks.Count);
    }

    private static int? Retention(IReadOnlyCollection<Domain.Programs.Enrollment> enrollments) =>
        Percent(enrollments.Count(e => e.EndedAt == null), enrollments.Count);

    internal static int? Percent(int part, int whole) => whole == 0 ? null : (int)Math.Round(100.0 * part / whole, MidpointRounding.AwayFromZero);

    internal static int? Average(IEnumerable<int?> values)
    {
        var known = values.Where(v => v is not null).Select(v => v!.Value).ToList();
        return known.Count == 0 ? null : (int)Math.Round(known.Average(), MidpointRounding.AwayFromZero);
    }

    private sealed record YouthLearning(int? Completion, Dictionary<Guid, int?> Modules, TrackStatus Track);

    private sealed record CohortFacts(List<Domain.Programs.Enrollment> Enrollments, List<AttendanceRecord> Records, Dictionary<Guid, Guid> Accounts, string? TrackName,
        List<CurriculumModule> Modules, Dictionary<Guid, YouthLearning> Learning);
}
