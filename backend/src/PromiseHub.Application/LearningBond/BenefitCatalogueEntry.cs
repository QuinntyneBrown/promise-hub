namespace PromiseHub.Application.LearningBond;

/// <summary>
/// One benefit in the platform's catalogue (L2-155): its program, level, the province or municipality it serves, its channel, its source,
/// and a versioned rule with its effective date. No organization changes it.
/// </summary>
public sealed record BenefitCatalogueEntry(string Key, string Name, BenefitLevel Level, string? Province, string? Municipality, BenefitChannel Channel, string Source,
    string SourceLink, string RuleVersion, DateOnly EffectiveFrom, BenefitRule Rule, string? SendTo = null);
