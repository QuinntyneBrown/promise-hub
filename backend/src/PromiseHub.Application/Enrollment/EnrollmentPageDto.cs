namespace PromiseHub.Application.Enrollment;

/// <summary>The public face of a program's enrollment link: whether it is open, and whom to call.</summary>
public sealed record EnrollmentPageDto(string Program, string Organization, string? Phone, bool Open, string? Schedule, string? Ages, DateOnly StartsOn);
