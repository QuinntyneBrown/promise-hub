namespace PromiseHub.Application.LearningBond;

/// <summary>
/// learning-bond-benefits-intake (L2-154): what is reused (the children, whether the SIN and the tax answer are given) and the answers so far.
/// </summary>
public sealed record BenefitsIntakeDto(string Language, string Organization, string Explanation, IReadOnlyList<BenefitsIntakeChildDto> Children, bool SinGiven,
    bool TaxAnswered, int? HouseholdSize, string? MaritalStatus, string? CcbNow, string? IncomeChanged);
