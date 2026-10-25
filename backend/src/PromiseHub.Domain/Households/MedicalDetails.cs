namespace PromiseHub.Domain.Households;

public sealed record MedicalDetails(string? Allergies, string? Medication, string? Conditions, string? Doctor, bool RedAlert);
