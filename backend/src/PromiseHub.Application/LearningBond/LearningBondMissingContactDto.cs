namespace PromiseHub.Application.LearningBond;

/// <summary>A covered household no guardian of which has a mobile number or a working email (L2-140 criterion 1): its name, primary guardian and programs; never a contact.</summary>
public sealed record LearningBondMissingContactDto(Guid HouseholdId, string Name, string? Guardian, string Programs);
