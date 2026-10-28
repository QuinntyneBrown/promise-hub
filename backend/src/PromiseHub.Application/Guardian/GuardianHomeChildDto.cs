namespace PromiseHub.Application.Guardian;

/// <summary>A child on the family page: enrollments, pickups, health and the active programs the child is on (L2-102 criterion 1).</summary>

public sealed record GuardianHomeChildDto(string Name, string FirstName, IReadOnlyList<GuardianHomeEnrollmentDto> Enrollments, Guid Id = default,
    IReadOnlyList<GuardianHomePickupDto>? Pickups = null, string? Allergies = null, string? Medication = null,
    IReadOnlyList<string>? Programs = null);
