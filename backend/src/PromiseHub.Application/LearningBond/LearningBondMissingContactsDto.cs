namespace PromiseHub.Application.LearningBond;

/// <summary>The covered households to collect a mobile number or email from (learning-bond-launch/missing-contacts).</summary>
public sealed record LearningBondMissingContactsDto(IReadOnlyList<LearningBondMissingContactDto> Households);
