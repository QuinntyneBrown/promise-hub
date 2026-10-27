namespace PromiseHub.Application.Mentoring;

/// <summary>A quiz attempt awaiting the mentor's approval (L2-081 criterion 1): who, which quiz, the attempt and its auto-score.</summary>
public sealed record QuizApprovalItemDto(Guid Id, string YouthName, string QuizTitle, string ModuleTitle, int Number, int Score, int Correct, int Total, int PassMark, DateTimeOffset SubmittedAt);
