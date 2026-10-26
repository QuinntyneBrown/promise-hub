namespace PromiseHub.Application.Households;

public sealed record HouseholdDto(
    Guid Id,
    string Name,
    string Language,
    IReadOnlyList<GuardianDto> Guardians,
    IReadOnlyList<ChildSummaryDto> Children,
    bool MedicalRestricted);
