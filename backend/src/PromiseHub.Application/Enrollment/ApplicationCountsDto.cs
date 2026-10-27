namespace PromiseHub.Application.Enrollment;

/// <summary>How many of the organization's applications have each status.</summary>
public sealed record ApplicationCountsDto(int WaitingReview, int Waitlisted, int Accepted, int Declined);
