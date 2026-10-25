namespace PromiseHub.Application.Enrollment;

/// <summary>A child waiting for review or on the waitlist, with the family and what staff need to decide.</summary>
public sealed record EnrollmentRequestDto(
    Guid Id,
    Guid ChildId,
    Guid HouseholdId,
    string Child,
    int? Age,
    string Guardian,
    string? Phone,
    string Language,
    string? Medical,
    bool Returning,
    DateTimeOffset SubmittedAt,
    string Status,
    int? Position);
