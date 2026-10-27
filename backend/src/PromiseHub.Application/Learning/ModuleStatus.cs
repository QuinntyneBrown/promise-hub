using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>One published module and its published lessons in order, for one youth (L2-068 criteria 2 to 4).</summary>
public sealed record ModuleStatus(CurriculumModule Module, int Position, IReadOnlyList<LessonStatus> Lessons, bool Locked, string? UnlockAfter)
{
    public int Done => Lessons.Count(l => l.Done);

    public bool Complete => Lessons.All(l => l.Done);

    public string State => Locked ? "locked" : Lessons.Count > 0 && Complete ? "done" : Done > 0 ? "in-progress" : "not-started";
}
