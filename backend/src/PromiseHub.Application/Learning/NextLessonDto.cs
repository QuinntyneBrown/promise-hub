namespace PromiseHub.Application.Learning;

/// <summary>The lesson to continue with on the Learning home.</summary>
public sealed record NextLessonDto(Guid LessonId, string Kind, string Title, Guid ModuleId, string ModuleTitle, string? Reading, int? Minutes, int ModuleCompleted, int ModuleTotal);
