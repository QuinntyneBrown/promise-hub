using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>A track a youth's program follows, with its published modules in order (L2-068).</summary>
public sealed record TrackStatus(Track Track, string Program, IReadOnlyList<ModuleStatus> Modules)
{
    public int Done => Modules.Sum(m => m.Done);

    public int Total => Modules.Sum(m => m.Lessons.Count);

    /// <summary>The first open lesson the youth has not done, in module and lesson order.</summary>
    public (ModuleStatus Module, LessonStatus Lesson)? Next =>
        Modules.SelectMany(m => m.Lessons.Select(l => (Module: m, Lesson: l))).Where(x => !x.Lesson.Done && !x.Lesson.Locked)
            .Select(x => ((ModuleStatus, LessonStatus)?)x).FirstOrDefault();
}
