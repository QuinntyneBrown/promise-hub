namespace PromiseHub.Application.Reports;

public sealed record ExportCreatedDto(Guid Id, string FileName, int Rows, DateTimeOffset ExpiresAt);
