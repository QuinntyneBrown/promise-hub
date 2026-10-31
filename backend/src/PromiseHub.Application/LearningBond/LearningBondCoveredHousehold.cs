namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A household the coverage reaches: the covered programs that reach it (names, and their ids in the same order) and its eligible children's
/// first names, in name order.
/// </summary>
public sealed record LearningBondCoveredHousehold(Guid HouseholdId, IReadOnlyList<string> Programs, IReadOnlyList<string> Children, IReadOnlyList<Guid> ProgramIds);
