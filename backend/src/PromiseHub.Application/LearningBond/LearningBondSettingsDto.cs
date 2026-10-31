namespace PromiseHub.Application.LearningBond;

/// <summary>GET /learning-bond/settings (L2-138 criterion 1): coverage, the roles that see status, and the running programs with their counts.</summary>
public sealed record LearningBondSettingsDto(
    string Coverage,
    IReadOnlyList<Guid> ProgramIds,
    IReadOnlyList<string> StatusRoles,
    IReadOnlyList<LearningBondProgramDto> Programs,
    int AllHouseholds);
