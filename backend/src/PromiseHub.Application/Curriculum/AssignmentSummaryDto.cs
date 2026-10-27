namespace PromiseHub.Application.Curriculum;

/// <summary>An assignment in the module editor's Quizzes and assignments card; LessonTitle null for the whole module.</summary>
public sealed record AssignmentSummaryDto(Guid Id, string Title, string? LessonTitle, string Status, int TotalPoints);
