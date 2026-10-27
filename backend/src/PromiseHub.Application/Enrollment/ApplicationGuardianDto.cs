namespace PromiseHub.Application.Enrollment;

/// <summary>The family contact on an application: the household's primary guardian.</summary>
public sealed record ApplicationGuardianDto(string Name, string? Mobile, string? Email, string Language);
