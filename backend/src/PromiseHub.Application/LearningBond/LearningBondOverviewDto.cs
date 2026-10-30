namespace PromiseHub.Application.LearningBond;

/// <summary>
/// GET /learning-bond/overview, the Settings › Learning Bond hub (L2-136 criterion 9): the agreement's acceptance and any pending version,
/// coverage, status roles, sender name and languages, and why Launch is disabled, if it is. Counts and names of programs only.
/// </summary>
public sealed record LearningBondOverviewDto(
    int AgreementVersion,
    LearningBondAcceptanceDto? Acceptance,
    int? PendingVersion,
    DateOnly? PendingEffectiveOn,
    string Coverage,
    IReadOnlyList<string> Programs,
    int Households,
    IReadOnlyList<string> StatusRoles,
    string SenderName,
    IReadOnlyList<string> Languages,
    string? LaunchBlocked);
