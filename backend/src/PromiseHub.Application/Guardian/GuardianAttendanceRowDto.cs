namespace PromiseHub.Application.Guardian;

/// <summary>A marked session on a child's guardian page: Present, Late, Excused or Absent (L2-102 criterion 3).</summary>
public sealed record GuardianAttendanceRowDto(Guid EventId, string Name, DateTimeOffset StartsAt, string Status);
