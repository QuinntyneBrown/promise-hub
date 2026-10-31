namespace PromiseHub.Application.LearningBond;

/// <summary>The benefits intake (L2-154 criteria 1 to 4): who claims each child only for Separated or Divorced.</summary>
public sealed record SaveBenefitsIntakeRequest(int? HouseholdSize, string? MaritalStatus, string? CcbNow, string? IncomeChanged, Dictionary<Guid, string>? Custody);
