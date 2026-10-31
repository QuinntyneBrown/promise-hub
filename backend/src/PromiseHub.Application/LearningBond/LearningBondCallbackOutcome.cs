namespace PromiseHub.Application.LearningBond;

/// <summary>A guardian's call request: done with what to tell them, refused by field, or unknown (L2-142 criteria 3 and 6).</summary>
public sealed record LearningBondCallbackOutcome(ResultStatus Status, string? Message = null, IReadOnlyDictionary<string, string>? Errors = null);
