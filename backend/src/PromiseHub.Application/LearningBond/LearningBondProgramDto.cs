namespace PromiseHub.Application.LearningBond;

/// <summary>A running program and the households it would reach (L2-138 criterion 1): counts only.</summary>
public sealed record LearningBondProgramDto(Guid Id, string Name, int Households);
