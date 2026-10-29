namespace PromiseHub.Application.Reports;

/// <summary>The same numbers across every active program of the organization; completion is null while Learning is off.</summary>
public sealed record CohortComparisonDto(int? AttendanceRate, int? RetentionRate, int? AverageCompletion);
