namespace PromiseHub.Application.Learning;

/// <summary>
/// A quiz's rules and where the youth stands with it (L2-075 criterion 1); never its correct answers. <see cref="AttemptsAllowed"/> is
/// null for unlimited; <see cref="AttemptNumber"/> is the attempt in progress or the one she would start.
/// </summary>
public sealed record QuizIntroDto(
    Guid Id,
    string Title,
    Guid ModuleId,
    string ModuleTitle,
    string? LessonTitle,
    int QuestionCount,
    int PassMark,
    int? AttemptsAllowed,
    string Feedback,
    int AttemptsUsed,
    int AttemptNumber,
    InProgressDto? InProgress,
    int? BestScore,
    bool Passed,
    Guid? BestAttemptId,
    Guid? LastAttemptId,
    bool Awaiting,
    bool CanStart);
