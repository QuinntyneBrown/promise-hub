using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The youth's own progress (L2-088, ADR 0059): lessons and quizzes from the same <see cref="LearnerProgress"/> the journey reads, her competencies from
/// <see cref="LearnerStanding"/>, and her child's marked attendance only while Roll Call is on.
/// </summary>
public sealed class ProgressViewHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, LearnerStanding standing, IModuleGate modules,
    TimeProvider clock)
{
    public async Task<ProgressViewDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await progress.TracksAsync(cancellationToken);
        var completedAt = await db.LessonProgress.AsNoTracking().Where(p => p.MembershipId == tenant.MembershipId)
            .Select(p => p.CompletedAt).ToListAsync(cancellationToken);
        var quizzes = tracks.SelectMany(t => t.Modules).SelectMany(m => m.Quizzes.Select(q => (Module: m, Quiz: q)))
            .Where(x => x.Quiz.Attempted || x.Quiz.Awaiting)
            .Select(x => new QuizHistoryDto(x.Quiz.Quiz.Id, x.Quiz.Quiz.Title, x.Module.Module.Title, x.Quiz.BestScore,
                x.Quiz.BestScore is null ? null : x.Quiz.Passed, x.Quiz.BestScore is null))
            .ToList();
        var scores = quizzes.Where(q => q.BestScore is not null).Select(q => q.BestScore!.Value).ToList();
        var stages = await db.ProgressionStages.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken);
        var competencies = (await standing.CompetenciesAsync(cancellationToken))
            .Select(c => new CompetencyLevelDto(c.Competency.Id, c.Competency.Name, c.Competency.StageId is { } id ? stages.GetValueOrDefault(id) : null, c.Level.ToString()))
            .ToList();
        return new ProgressViewDto(
            tracks.Sum(t => t.Done),
            tracks.Sum(t => t.Total),
            LearnerStreak.Weeks(completedAt, clock.GetUtcNow()),
            scores.Count == 0 ? null : (int)Math.Round(scores.Average(), MidpointRounding.AwayFromZero),
            quizzes,
            competencies,
            await modules.IsOnAsync(ModuleId.RollCall, cancellationToken) ? await AttendanceAsync(cancellationToken) : null);
    }

    private async Task<AttendanceSummaryDto> AttendanceAsync(CancellationToken cancellationToken)
    {
        var childId = await db.Memberships.AsNoTracking()
            .Where(m => m.Id == tenant.MembershipId && m.OrganizationId == tenant.OrganizationId)
            .Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        if (childId is not { } child)
        {
            return new AttendanceSummaryDto(0, 0, []);
        }
        var rows = await (from r in db.AttendanceRecords.AsNoTracking()
                          join e in db.Events.AsNoTracking() on r.EventId equals e.Id
                          where r.ChildId == child && r.Status != AttendanceStatus.NotYet
                          select new { e.Id, e.Name, e.StartsAt, r.Status }).ToListAsync(cancellationToken);
        var sessions = rows.OrderByDescending(r => r.StartsAt)
            .Select(r => new SessionAttendanceDto(r.Id, r.Name, r.StartsAt, r.Status == AttendanceStatus.Absent ? "Absent" : "Present"))
            .ToList();
        return new AttendanceSummaryDto(sessions.Count(s => s.Status == "Present"), sessions.Count, sessions);
    }
}
