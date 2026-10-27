namespace PromiseHub.Application.Enrollment;

/// <summary>Place an application into a cohort (a program), with an optional note to the family.</summary>
public sealed record PlaceApplicantCommand(Guid? ProgramId, string? Note);
