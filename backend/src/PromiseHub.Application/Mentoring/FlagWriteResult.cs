namespace PromiseHub.Application.Mentoring;

/// <summary>Raising or resolving a flag: the result, the flag when it was written, and the code of a conflict (already-flagged, already-resolved).</summary>
public sealed record FlagWriteResult(Result Result, AtRiskFlagDto? Flag = null, string? Code = null);
