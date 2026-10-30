namespace PromiseHub.Application.LearningBond;

/// <summary>PUT /learning-bond/settings: <c>AllPrograms</c> or <c>ChosenPrograms</c> with program ids, and the roles that see status.</summary>
public sealed record SaveLearningBondSettingsRequest(string? Coverage, IReadOnlyList<Guid>? ProgramIds, IReadOnlyList<string>? StatusRoles);
