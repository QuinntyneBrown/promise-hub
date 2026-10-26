namespace PromiseHub.Application.Reports;

/// <summary>A program (or all) and an optional period of session dates.</summary>
public sealed record ReportFilter(Guid? ProgramId, DateOnly? From, DateOnly? To);
