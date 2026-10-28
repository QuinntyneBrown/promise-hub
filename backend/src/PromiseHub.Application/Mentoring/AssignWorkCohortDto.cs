namespace PromiseHub.Application.Mentoring;

/// <summary>A cohort the mentor is on, with the youth on its active roster and the track it follows (L2-092 criterion 1).</summary>
public sealed record AssignWorkCohortDto(Guid Id, string Name, int YouthCount, Guid? TrackId);
