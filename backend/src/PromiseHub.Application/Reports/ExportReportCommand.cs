namespace PromiseHub.Application.Reports;

/// <summary>
/// What to export (L2-025, L2-129): <see cref="Kind"/> absent or Summary is the report export; Cohort and Progress need a program; Staff takes
/// a period of 30 or 90 days, or all time.
/// </summary>
public sealed record ExportReportCommand(Guid? ProgramId, DateOnly? From, DateOnly? To, string? Kind = null, int? Days = null);
