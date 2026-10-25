namespace PromiseHub.Application.Enrollment;

/// <summary>WaitingReview, or Waitlisted with the position of the first child.</summary>
public sealed record EnrollmentSubmitDto(string Status, int? Position, int Children, string Program);
