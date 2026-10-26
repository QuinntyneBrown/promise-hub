namespace PromiseHub.Application.Reports;

/// <summary>A stored export, or why it can't be downloaded.</summary>
public sealed record ExportFile(ResultStatus Status, string? FileName, string? Content);
