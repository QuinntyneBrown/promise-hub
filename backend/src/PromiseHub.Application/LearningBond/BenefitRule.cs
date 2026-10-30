namespace PromiseHub.Application.LearningBond;

/// <summary>
/// What a catalogue entry decides for a household (L2-155, L2-156): the yearly amount per child by age (null when it varies), whether the
/// family already gets it, a reason it doesn't apply, and a document the program needs first.
/// </summary>
public sealed record BenefitRule(Func<int, int>? PerChild, Func<BenefitHousehold, bool>? AlreadyGets = null, Func<BenefitHousehold, string?>? NotEligible = null,
    string? Document = null);
