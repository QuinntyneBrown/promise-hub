namespace PromiseHub.Application.Attendance;

/// <summary>One session of a cohort's history (L2-097): its marks, the rate (attended of marked, null when none) and its status.</summary>
public sealed record SessionAttendanceDto(Guid EventId, string Name, DateTimeOffset StartsAt, int Present, int Late, int Excused, int Absent, int? Rate, string Status);
