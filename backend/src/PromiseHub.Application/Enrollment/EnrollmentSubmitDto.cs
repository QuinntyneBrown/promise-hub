namespace PromiseHub.Application.Enrollment;

/// <summary>WaitingReview, or Waitlisted with the position of the first child; who applied and whether the season consent was given.</summary>
public sealed record EnrollmentSubmitDto(string Status, int? Position, int Children, string Program, string AppliedAs, bool SeasonConsent);
