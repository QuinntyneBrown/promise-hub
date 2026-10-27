namespace PromiseHub.Application.Curriculum;

/// <summary>A new quiz of a module, attached to the whole module (LessonId null) or one of its lessons.</summary>
public sealed record CreateQuizCommand(Guid ModuleId, Guid? LessonId, string? Title);
