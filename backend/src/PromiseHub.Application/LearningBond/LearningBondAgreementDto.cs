namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The current agreement and where the organization stands with it (L2-136, L2-137): its acceptance of this version, its latest acceptance of
/// an earlier one while a new version is pending, the open signer request, and whether Learning Bond is on.
/// </summary>
public sealed record LearningBondAgreementDto(
    int Version,
    DateOnly EffectiveOn,
    IReadOnlyList<LearningBondAgreementSectionDto> Sections,
    LearningBondAcceptanceDto? Acceptance,
    LearningBondAcceptanceDto? EarlierAcceptance,
    LearningBondSignerRequestDto? Signer,
    bool ModuleOn);
