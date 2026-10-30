namespace PromiseHub.Application.LearningBond;

/// <summary>
/// What the named signer reads behind the link (L2-137 criterion 8): the organization, the admin who asked, the signer's name and title,
/// and the current agreement. Never the signer's email or the token.
/// </summary>
public sealed record LearningBondSignerAgreementDto(
    string Organization,
    string RequestedBy,
    string Name,
    string Title,
    int Version,
    DateOnly EffectiveOn,
    IReadOnlyList<LearningBondAgreementSectionDto> Sections);
