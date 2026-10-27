namespace PromiseHub.Application.Learning;

/// <summary>An attempt in progress: its questions in the attempt's order, her saved answers and the question she was on (L2-075 criteria 3 and 4).</summary>
public sealed record QuizAttemptDto(
    Guid AttemptId,
    Guid QuizId,
    string Title,
    Guid ModuleId,
    string ModuleTitle,
    int Number,
    int? AttemptsAllowed,
    int Position,
    IReadOnlyList<AttemptQuestionDto> Questions,
    IReadOnlyList<QuizAnswer> Answers);
