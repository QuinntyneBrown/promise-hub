namespace PromiseHub.Application.Enrollment;

/// <summary>A decision on one child, with an optional note (a reason is required to decline).</summary>
public sealed record ReviewEnrollmentCommand(ReviewDecision Decision, string? Note);
