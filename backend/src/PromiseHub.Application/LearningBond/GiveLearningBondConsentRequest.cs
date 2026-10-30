namespace PromiseHub.Application.LearningBond;

/// <summary>The children ticked and the guardian's typed full name (L2-145 criterion 2).</summary>
public sealed record GiveLearningBondConsentRequest(IReadOnlyList<Guid>? ChildIds, string? TypedName, string? Scope = null);
