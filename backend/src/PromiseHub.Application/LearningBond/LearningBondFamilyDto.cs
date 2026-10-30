namespace PromiseHub.Application.LearningBond;

/// <summary>A covered household as staff see it (L2-142 criterion 1): its name, primary guardian, programs, status and last change; nothing else about the claim.</summary>
/// While a call is requested it carries the number and time of day the guardian gave, so staff can call.
public sealed record LearningBondFamilyDto(Guid HouseholdId, string Name, string? Guardian, string Programs, string Status, DateTimeOffset? ChangedAt,
    string? CallPhone = null, string? CallWhen = null);
