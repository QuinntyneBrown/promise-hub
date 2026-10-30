namespace PromiseHub.Application.LearningBond;

/// <summary>The benefits check on the guardian page (L2-153 criteria 1 and 4): offered until its consent is given, and whether it is.</summary>
public sealed record GuardianBenefitsOfferDto(bool Offered, bool Consented);
