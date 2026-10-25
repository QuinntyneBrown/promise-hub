namespace PromiseHub.Application.Households;

public sealed record MedicalDto(
    string? Allergies,
    string? Medication,
    string? Conditions,
    string? Doctor,
    bool RedAlert,
    DateTimeOffset? UpdatedAt,
    string? UpdatedBy);
