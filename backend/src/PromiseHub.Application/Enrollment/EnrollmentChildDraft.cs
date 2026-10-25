namespace PromiseHub.Application.Enrollment;

/// <summary>A child: <see cref="Id"/> is set for a returning child; <see cref="Enroll"/> is whether to enroll them this time.</summary>
public sealed record EnrollmentChildDraft(
    Guid? Id,
    string? FirstName,
    string? LastName,
    DateOnly? DateOfBirth,
    string? School,
    string? Allergies,
    string? Medication,
    bool Enroll);
