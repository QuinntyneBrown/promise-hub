using PromiseHub.Application.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>One visible, unlocked lesson for the youth (L2-069 criteria 1 and 2); locked answers what to finish first.</summary>
public sealed class LessonViewHandler(LearnerProgress progress)
{
    public async Task<Gated<LessonViewDto>> HandleAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found)
        {
            return Gated<LessonViewDto>.NotFound();
        }
        var (track, module, status) = found;
        if (status.Locked)
        {
            return Gated<LessonViewDto>.Locked(status.UnlockAfter);
        }
        var lesson = status.Lesson;
        var index = module.Lessons.ToList().IndexOf(status);
        var next = index + 1 < module.Lessons.Count ? module.Lessons[index + 1].Lesson : null;
        return Gated<LessonViewDto>.Found(new LessonViewDto(lesson.Id, lesson.Kind.ToString(), lesson.Title, lesson.Reading, lesson.Passage, lesson.Minutes,
            CurriculumRules.SplitLines(lesson.Objectives), lesson.Body, CurriculumRules.SplitLines(lesson.Prompts),
            module.Module.Id, module.Module.Title, track.Track.Id, track.Track.Name, index + 1, module.Lessons.Count,
            lesson.VideoKey is not null, status.Done, next is null ? null : new LessonRefDto(next.Id, next.Title, next.Kind.ToString())));
    }
}
