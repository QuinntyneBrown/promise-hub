namespace PromiseHub.Domain.Households;

/// <summary>A child's medical details. <see cref="AlertInstruction"/> tells staff what to do for a red-alert allergy.</summary>
public sealed record MedicalDetails(string? Allergies, string? Medication, string? Conditions, string? Doctor, bool RedAlert, string? AlertInstruction = null);
