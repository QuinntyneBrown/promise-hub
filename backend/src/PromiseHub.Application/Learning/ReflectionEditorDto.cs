namespace PromiseHub.Application.Learning;

/// <summary>What the reflection page needs (L2-089 criterion 1): the lesson, its prompts, her mentor's name and her saved reflection or null.</summary>
public sealed record ReflectionEditorDto(
    Guid LessonId,
    string LessonTitle,
    Guid ModuleId,
    string ModuleTitle,
    IReadOnlyList<string> Prompts,
    string? MentorName,
    ReflectionDto? Reflection);
