namespace PromiseHub.Application.Learning;

/// <summary>Every answer of the attempt so far and the zero-based question she is on.</summary>
public sealed record SaveAnswersRequest(IReadOnlyList<QuizAnswer>? Answers, int Position);
