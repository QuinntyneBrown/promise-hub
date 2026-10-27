namespace PromiseHub.Application.Learning;

/// <summary>After completing a lesson: the next lesson of the module, or that the module is now done (L2-069 criterion 4).</summary>
public sealed record CompletionDto(Guid? NextLessonId, string? NextLessonTitle, string? NextLessonKind, bool ModuleCompleted);
