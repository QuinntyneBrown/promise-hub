namespace PromiseHub.Application.Reports;

/// <summary>A quiz the youth has a counted score on, with her best score.</summary>
public sealed record YouthQuizDto(Guid QuizId, string Title, int BestScore);
