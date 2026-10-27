namespace PromiseHub.Application.Curriculum;

/// <summary>An active program (cohort) of the organization and the track it follows, for the track-cohorts dialog.</summary>
public sealed record CurriculumProgramDto(Guid Id, string Name, string? Term, string? Schedule, Guid? TrackId);
