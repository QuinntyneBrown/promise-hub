namespace PromiseHub.Application.LearningBond;

/// <summary>The Learning Bond card on guardian-home (L2-144 criterion 7): where each covered child under 18 stands. Never a SIN or an amount owed.</summary>
public sealed record GuardianHomeLearningBondDto(IReadOnlyList<GuardianHomeLearningBondChildDto> Children);
