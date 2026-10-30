namespace PromiseHub.Application.LearningBond;

/// <summary>The benefits intake's answers (L2-154), stored only as ciphertext: who claims each child is by child id.</summary>
public sealed record BenefitAnswers(int HouseholdSize, string MaritalStatus, string CcbNow, string? IncomeChanged, IReadOnlyDictionary<Guid, string> Custody);
