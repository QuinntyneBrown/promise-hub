namespace PromiseHub.Application.Guardian;

/// <summary>The consents on record for a child, read only: participation (null without a youth account) and slips (null while Slips is off).</summary>
public sealed record GuardianConsentsDto(GuardianParticipationDto? Participation, IReadOnlyList<GuardianSlipConsentDto>? Slips);
