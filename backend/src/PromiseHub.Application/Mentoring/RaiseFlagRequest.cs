namespace PromiseHub.Application.Mentoring;

/// <summary>A mentor raises an at-risk flag on one of his youth (L2-091 criteria 1 and 2).</summary>
public sealed record RaiseFlagRequest(Guid? ChildId, string? Severity, string? Reason);
