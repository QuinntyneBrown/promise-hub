namespace PromiseHub.Application.Mentoring;

/// <summary>One attendance change of a mentor's youth: CheckedIn or SignedOut at the time it happened, or Absent at the session's start.</summary>
public sealed record MentorActivityDto(Guid ChildId, string YouthName, string Kind, string Session, DateTimeOffset At);
