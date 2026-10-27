namespace PromiseHub.Application.Curriculum;

public sealed record CreateLessonCommand(Guid ModuleId, string? Title);
