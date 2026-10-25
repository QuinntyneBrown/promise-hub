namespace PromiseHub.Application.Attendance;

public sealed record ApprovedAdultDto(Guid GuardianId, string Name, string Relationship, bool IsPrimary);
