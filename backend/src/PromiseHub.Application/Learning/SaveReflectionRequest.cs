namespace PromiseHub.Application.Learning;

/// <summary>A reflection to save: the mood, her words, one thing she'll do and whether her mentor may read it.</summary>
public sealed record SaveReflectionRequest(string? Mood, string? Text, string? Action, bool Shared);
