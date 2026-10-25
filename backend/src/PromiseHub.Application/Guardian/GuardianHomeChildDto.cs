namespace PromiseHub.Application.Guardian;

public sealed record GuardianHomeChildDto(string Name, string FirstName, IReadOnlyList<GuardianHomeEnrollmentDto> Enrollments, Guid Id = default,
    IReadOnlyList<GuardianHomePickupDto>? Pickups = null);
