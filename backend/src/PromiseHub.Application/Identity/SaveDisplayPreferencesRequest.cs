namespace PromiseHub.Application.Identity;

/// <summary>The display preferences to keep (L2-119, L2-120).</summary>
public sealed record SaveDisplayPreferencesRequest(string? Theme, string? TextSize, bool ReduceMotion);
