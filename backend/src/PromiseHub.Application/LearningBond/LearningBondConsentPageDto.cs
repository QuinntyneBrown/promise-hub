namespace PromiseHub.Application.LearningBond;

/// <summary>The consent step (learning-bond-consent): the agent's line and each child still to consent for, in the household's language.</summary>
public sealed record LearningBondConsentPageDto(string Language, string Organization, string Explanation, int WordingVersion, IReadOnlyList<LearningBondConsentChildDto> Children);
