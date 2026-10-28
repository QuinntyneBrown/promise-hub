namespace PromiseHub.Application.Mentoring;

/// <summary>One at-risk flag as its readers see it (L2-091): Open or Resolved, with the resolution once resolved.</summary>
public sealed record AtRiskFlagDto(
    Guid Id,
    Guid ChildId,
    string YouthName,
    string Severity,
    string Reason,
    string RaisedBy,
    DateTimeOffset RaisedAt,
    string Status,
    string? Outcome,
    string? ResolutionNote,
    string? ResolvedBy,
    DateTimeOffset? ResolvedAt);
