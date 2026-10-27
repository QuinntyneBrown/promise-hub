namespace PromiseHub.Application.Mentoring;

/// <summary>A youth's attendance at a session that has started: CheckedIn, SignedOut or Absent.</summary>
public sealed record MentorAttendanceDto(string Session, DateTimeOffset At, string Status);
