namespace PromiseHub.Application.Imports;

public sealed record ImportUploadDto(Guid Id, string FileName, int RowCount, int Matched, IReadOnlyList<ImportColumnDto> Columns);
