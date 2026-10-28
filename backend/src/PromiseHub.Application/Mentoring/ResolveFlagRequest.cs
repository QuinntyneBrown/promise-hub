namespace PromiseHub.Application.Mentoring;

/// <summary>Resolving an at-risk flag: how it was resolved and an optional note (L2-091 criterion 5).</summary>
public sealed record ResolveFlagRequest(string? Outcome, string? Note);
