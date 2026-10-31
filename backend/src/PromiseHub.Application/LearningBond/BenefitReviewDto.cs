namespace PromiseHub.Application.LearningBond;

/// <summary>
/// learning-bond-benefit-review (L2-156 criterion 2): one benefit's application, its channel (Submit, or a form the guardian sends), the
/// review version Submit quotes, the document attached, and where a form goes.
/// </summary>
public sealed record BenefitReviewDto(Guid Id, string Language, string Organization, string Explanation, string BenefitKey, string Program, string Channel, string Status,
    int ReviewVersion, int? Amount, string? DocumentFile, string? SendTo, BenefitReviewFieldsDto Fields);
