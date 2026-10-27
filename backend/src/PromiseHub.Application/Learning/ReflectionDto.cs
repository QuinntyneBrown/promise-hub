namespace PromiseHub.Application.Learning;

/// <summary>A youth's saved reflection as she sees it (L2-089 criterion 1).</summary>
public sealed record ReflectionDto(string Mood, string Text, string? Action, bool Shared, DateTimeOffset SavedAt);
