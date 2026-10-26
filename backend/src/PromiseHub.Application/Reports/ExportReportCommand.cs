namespace PromiseHub.Application.Reports;

public sealed record ExportReportCommand(Guid? ProgramId, DateOnly? From, DateOnly? To);
