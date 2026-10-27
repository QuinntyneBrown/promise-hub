using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Learning;

/// <summary>A visible, unlocked assignment's brief, rubric, due state, mentor and the caller's submission (L2-077 criteria 1, 2 and 6).</summary>
public sealed class AssignmentBriefHandler(IPromiseHubDb db, LearnerProgress progress, YouthMentorName mentor, TimeProvider clock)
{
    public async Task<Gated<AssignmentBriefDto>> HandleAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        if (await progress.AssignmentAsync(assignmentId, cancellationToken) is not { } found)
        {
            return Gated<AssignmentBriefDto>.NotFound();
        }
        var (track, module, status) = found;
        if (status.Locked)
        {
            return Gated<AssignmentBriefDto>.Locked(status.UnlockAfter);
        }
        var a = status.Assignment;
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var rubric = await db.RubricCriteria.AsNoTracking().Where(r => r.AssignmentId == a.Id).OrderBy(r => r.Position)
            .Select(r => new RubricLineDto(r.Description, r.Points)).ToListAsync(cancellationToken);
        var lessonTitle = a.LessonId is { } lid ? module.Lessons.FirstOrDefault(l => l.Lesson.Id == lid)?.Lesson.Title : null;
        return Gated<AssignmentBriefDto>.Found(new AssignmentBriefDto(a.Id, a.Title, module.Module.Id, module.Module.Title, lessonTitle, a.Brief ?? string.Empty,
            DueRules.Types(a.SubmissionTypes), rubric, a.TotalPoints, a.DueDate, a.GraceDays, a.AllowLate, DueRules.State(a, today), DueRules.DaysLeft(a, today),
            await mentor.FindAsync(track.Track.Id, cancellationToken),
            status.SubmissionId is { } sid ? new SubmissionRefDto(sid, status.SubmissionStatus!) : null));
    }
}
