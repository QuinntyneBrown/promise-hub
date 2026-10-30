namespace PromiseHub.Application.LearningBond;

/// <summary>What a guardian link answers before the claim: the organization that sent it and the household's language.</summary>
public sealed record LearningBondGuardianDto(string Organization, string Language);
