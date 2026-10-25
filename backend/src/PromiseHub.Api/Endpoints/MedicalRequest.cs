namespace PromiseHub.Api.Endpoints;

public sealed record MedicalRequest(string? Allergies, string? Medication, string? Conditions, string? Doctor, bool RedAlert, string? AlertInstruction);
