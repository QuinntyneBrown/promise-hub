namespace PromiseHub.Application.Learning;

/// <summary>
/// A quiz on a module page (L2-075 criterion 2): <see cref="Status"/> is locked, next, in-progress, passed, not-passed or awaiting;
/// <see cref="BestScore"/> is her best counted score; <see cref="UnlockAfter"/> names what to finish while locked.
/// </summary>
public sealed record QuizItemDto(Guid Id, string Title, Guid? LessonId, int QuestionCount, bool Required, string Status, int? BestScore, string? UnlockAfter);
