namespace PromiseHub.Application.Identity;

/// <summary>A person's display preferences (L2-119, L2-120): theme, text size and reduce motion.</summary>
public sealed record DisplayPreferencesDto(string Theme, string TextSize, bool ReduceMotion);
