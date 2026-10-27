using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>
/// One published module, its published lessons in order, its published quizzes and assignments, for one youth (L2-068 criteria 2 to 4, L2-076
/// criterion 5): complete once every lesson is done and every required quiz is passed.
/// </summary>
public sealed record ModuleStatus(CurriculumModule Module, int Position, IReadOnlyList<LessonStatus> Lessons, bool Locked, string? UnlockAfter, IReadOnlyList<QuizStatus> Quizzes, IReadOnlyList<AssignmentStatus> Assignments)
{
    public int Done => Lessons.Count(l => l.Done);

    public bool Complete => Lessons.All(l => l.Done) && Quizzes.Where(q => q.Quiz.RequiredToComplete).All(q => q.Passed);

    public string State => Locked ? "locked" : Lessons.Count > 0 && Complete ? "done" : Done > 0 ? "in-progress" : "not-started";
}
