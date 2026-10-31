namespace PromiseHub.Application.LearningBond;

/// <summary>The covered households (learning-bond-families): how many are covered, the covered programs to filter by, and the rows that match.</summary>
public sealed record LearningBondFamiliesDto(int Covered, IReadOnlyList<LearningBondProgramDto> Programs, IReadOnlyList<LearningBondFamilyDto> Households);
