namespace PromiseHub.Application.Learning;

/// <summary>
/// A submitted attempt as its youth sees it (L2-076): <see cref="Status"/> is scored or awaiting-approval; while awaiting, the score,
/// pass and review are null or empty. <see cref="AttemptsLeft"/> is null with unlimited attempts.
/// </summary>
public sealed record QuizResultDto(
    Guid AttemptId,
    Guid QuizId,
    string Title,
    Guid ModuleId,
    string ModuleTitle,
    int Number,
    int? AttemptsAllowed,
    int AttemptsUsed,
    int? AttemptsLeft,
    string Status,
    DateTimeOffset? SubmittedAt,
    int? Score,
    int? Correct,
    int? Total,
    int PassMark,
    bool? Passed,
    int? BestScore,
    bool CanRetake,
    string Feedback,
    IReadOnlyList<ReviewQuestionDto> Review);
