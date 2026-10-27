namespace PromiseHub.Application.Learning;

/// <summary>One visible module with its lessons (L2-068 criteria 3 and 4); a locked module answers locked with its prerequisite.</summary>
public sealed class ModuleViewHandler(LearnerProgress progress)
{
    public async Task<Gated<ModuleViewDto>> HandleAsync(Guid moduleId, CancellationToken cancellationToken = default)
    {
        if (await progress.ModuleAsync(moduleId, cancellationToken) is not { } found)
        {
            return Gated<ModuleViewDto>.NotFound();
        }
        var (track, module) = found;
        if (module.Locked)
        {
            return Gated<ModuleViewDto>.Locked(module.UnlockAfter);
        }
        return Gated<ModuleViewDto>.Found(new ModuleViewDto(module.Module.Id, module.Module.Title, module.Module.Description, module.Module.Anchor,
            track.Track.Id, track.Track.Name, module.Position, track.Modules.Count, module.Done, module.State,
            module.Lessons.Select(l => new LessonItemDto(l.Lesson.Id, l.Lesson.Title, l.Lesson.Kind.ToString(), l.Lesson.Reading, l.Lesson.Minutes, l.State, l.UnlockAfter)).ToList(),
            module.Quizzes.Select(q => new QuizItemDto(q.Quiz.Id, q.Quiz.Title, q.Quiz.LessonId, q.QuestionCount, q.Quiz.RequiredToComplete, q.State, q.BestScore, q.UnlockAfter)).ToList()));
    }
}
