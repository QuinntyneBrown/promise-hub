namespace PromiseHub.Application.LearningBond;

/// <summary>The Benefits consent (L2-153 criterion 2): its own wording and version, and whether it is already given.</summary>
public sealed record BenefitsConsentDto(string Language, string Organization, string Wording, int WordingVersion, bool Given);
