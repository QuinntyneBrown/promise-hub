namespace PromiseHub.Application.Curriculum;

/// <summary>A quiz's settings: title, attachment, pass mark, attempts (null for unlimited), feedback, shuffle and required to complete.</summary>
public sealed record SaveQuizCommand(string? Title, Guid? LessonId, int PassMark, int? AttemptsAllowed, string? Feedback, bool Shuffle, bool RequiredToComplete, bool RequireApproval = false);
