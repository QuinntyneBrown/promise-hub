namespace PromiseHub.Application.Households;

/// <summary>A child's profile. <see cref="Medical"/> is null and <see cref="MedicalRestricted"/> true for roles without medical access.</summary>
public sealed record ChildDto(
    Guid Id,
    string Name,
    string FirstName,
    string LastName,
    DateOnly? DateOfBirth,
    int? Age,
    string? School,
    Guid HouseholdId,
    string HouseholdName,
    MedicalDto? Medical,
    bool MedicalRestricted);
