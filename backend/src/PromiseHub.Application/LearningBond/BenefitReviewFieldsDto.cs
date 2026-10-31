namespace PromiseHub.Application.LearningBond;

/// <summary>Every field of a benefit application as reviewed (L2-156 criterion 2); the SIN only as its last three digits.</summary>
public sealed record BenefitReviewFieldsDto(string ApplicantName, string? ApplicantSin, string MaritalStatus, string HouseholdSize, string Children, string? Address,
    string? Phone, string? Email, string CanadaChildBenefit, string Program);
