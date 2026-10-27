namespace PromiseHub.Application.Learning;

/// <summary>One session she was marked at: Present (checked in or signed out) or Absent.</summary>
public sealed record SessionAttendanceDto(Guid EventId, string Name, DateTimeOffset StartsAt, string Status);
