namespace PromiseHub.Application.LearningBond;

/// <summary>
/// learning-bond-benefits (L2-155, L2-156): each benefit, the children the check stopped for, the income note, the local-programs note and
/// whether the family already gets everything.
/// </summary>
public sealed record BenefitsDto(string Language, string Organization, string Explanation, IReadOnlyList<BenefitItemDto> Benefits, IReadOnlyList<string> Blocked,
    string? IncomeNote, string? LocalNote, bool AllReceived);
