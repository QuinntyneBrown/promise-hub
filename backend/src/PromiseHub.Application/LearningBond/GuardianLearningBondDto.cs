namespace PromiseHub.Application.LearningBond;

/// <summary>The guardian's Learning Bond page for a verified device (L2-144): in the household's language, the agent's line, the children and the household's status.</summary>
public sealed record GuardianLearningBondDto(string Language, string Organization, string? Phone, string Explanation, IReadOnlyList<GuardianLearningBondChildDto> Children,
    string Status, IReadOnlyList<GuardianLearningBondConsentDto>? Consents = null, GuardianBenefitsOfferDto? Benefits = null);
