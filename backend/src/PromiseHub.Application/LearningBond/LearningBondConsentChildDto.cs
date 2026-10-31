namespace PromiseHub.Application.LearningBond;

/// <summary>A child the guardian may still give Learning Bond consent for, with the exact wording of that consent (L2-145 criterion 1).</summary>
public sealed record LearningBondConsentChildDto(Guid Id, string FirstName, string Wording);
