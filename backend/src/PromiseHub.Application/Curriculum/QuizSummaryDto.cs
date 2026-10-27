namespace PromiseHub.Application.Curriculum;

/// <summary>A quiz in the module editor's Quizzes and assignments card; LessonTitle null for the whole module.</summary>
public sealed record QuizSummaryDto(Guid Id, string Title, string? LessonTitle, string Status, int QuestionCount);
