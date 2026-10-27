namespace PromiseHub.Application.Learning;

/// <summary>A youth's answer to one question: the zero-based options she chose, or her short-answer text.</summary>
public sealed record QuizAnswer(Guid QuestionId, IReadOnlyList<int>? Choices, string? Text);
