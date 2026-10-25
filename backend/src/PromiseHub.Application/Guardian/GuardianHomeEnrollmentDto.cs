namespace PromiseHub.Application.Guardian;

/// <summary>One program for one child: Enrolled, WaitingReview, Waitlisted (with the position) or Declined (with the reason).</summary>
public sealed record GuardianHomeEnrollmentDto(string Program, string Status, int? Position, string? Note, DateOnly StartsOn, string? Schedule);
