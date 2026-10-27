namespace PromiseHub.Application.Mentoring;

/// <summary>A reflection a youth shared with her mentor (L2-089 criterion 5).</summary>
public sealed record SharedReflectionDto(Guid LessonId, string LessonTitle, string ModuleTitle, string Mood, string Text, string? Action, DateTimeOffset SavedAt);
