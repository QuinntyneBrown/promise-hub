namespace PromiseHub.Application.Households;

public sealed record HouseholdSummaryDto(
    Guid Id,
    string Name,
    string? PrimaryGuardian,
    IReadOnlyList<string> Children,
    string Language,
    int MedicalFlags,
    bool MissingInfo);
