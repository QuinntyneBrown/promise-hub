namespace PromiseHub.Application.Curriculum;

/// <summary>A new assignment of a module, attached to the whole module (LessonId null) or one of its lessons.</summary>
public sealed record CreateAssignmentCommand(Guid ModuleId, Guid? LessonId, string? Title);
