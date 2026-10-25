namespace PromiseHub.Application.Imports;

public sealed record ImportPreviewDto(int Rows, IReadOnlyList<ImportRowIssueDto> Duplicates, IReadOnlyList<ImportRowIssueDto> NeedLook, string? ProgramName);
