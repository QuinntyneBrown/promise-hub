namespace PromiseHub.Application.Reports;

/// <summary>A program on whose mentor team a mentor is, as its lead or supporting.</summary>
public sealed record StaffCohortDto(Guid ProgramId, string Name, bool Lead);
