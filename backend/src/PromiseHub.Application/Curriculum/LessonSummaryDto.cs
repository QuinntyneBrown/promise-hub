namespace PromiseHub.Application.Curriculum;

public sealed record LessonSummaryDto(Guid Id, string Title, int? Minutes, string Status);
