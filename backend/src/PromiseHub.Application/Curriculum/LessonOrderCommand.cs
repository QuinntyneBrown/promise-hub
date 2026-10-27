namespace PromiseHub.Application.Curriculum;

public sealed record LessonOrderCommand(IReadOnlyList<Guid>? LessonIds);
