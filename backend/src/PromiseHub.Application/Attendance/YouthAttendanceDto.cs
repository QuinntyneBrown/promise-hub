namespace PromiseHub.Application.Attendance;

/// <summary>One youth on a cohort's roster (L2-097): sessions attended (present or late) of marked, and below 70% when marked at least once.</summary>
public sealed record YouthAttendanceDto(Guid ChildId, string Name, int Attended, int Marked, int Late, int Excused, int Absent, int? Rate, bool BelowThreshold);
