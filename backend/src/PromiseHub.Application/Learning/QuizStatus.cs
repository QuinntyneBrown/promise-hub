using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>
/// One published quiz of a visible module as a youth stands with it (L2-075 criterion 2, L2-076, ADR 0055): locked with what to finish
/// first, her best counted score, whether an attempt is in progress or waiting for her mentor.
/// </summary>
public sealed record QuizStatus(Quiz Quiz, int QuestionCount, bool Locked, string? UnlockAfter, int? BestScore, bool InProgress, bool Awaiting, bool Attempted)
{
    public bool Passed => BestScore is { } best && best >= Quiz.PassMark;

    public string State => Locked ? "locked" : Passed ? "passed" : InProgress ? "in-progress" : Awaiting ? "awaiting" : Attempted ? "not-passed" : "next";
}
