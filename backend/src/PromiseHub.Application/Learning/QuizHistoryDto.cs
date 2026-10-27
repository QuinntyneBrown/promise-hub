namespace PromiseHub.Application.Learning;

/// <summary>A quiz she has submitted (L2-088 criterion 2): her best scored attempt and its pass, or Waiting while every submitted attempt awaits her mentor.</summary>
public sealed record QuizHistoryDto(Guid QuizId, string Title, string ModuleTitle, int? BestScore, bool? Passed, bool Waiting);
