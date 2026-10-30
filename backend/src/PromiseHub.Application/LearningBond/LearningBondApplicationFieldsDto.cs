namespace PromiseHub.Application.LearningBond;

/// <summary>Every field of the application as the guardian reviews it (L2-148 criterion 3); SINs only as their last three digits.</summary>
public sealed record LearningBondApplicationFieldsDto(string BeneficiaryName, DateOnly? DateOfBirth, string? ChildSin, string CaregiverName, string? Address,
    string? GuardianSin, string? Phone, string? Email, string Language);
