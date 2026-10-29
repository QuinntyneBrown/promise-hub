namespace PromiseHub.Application.Mentoring;

/// <summary>A youth in the mentor's scope with no mentor check-in from him within the organization's cadence (L2-125); the last one's date or null.</summary>
public sealed record MentorCheckInDueDto(Guid ChildId, string YouthName, string? LastCheckIn);
