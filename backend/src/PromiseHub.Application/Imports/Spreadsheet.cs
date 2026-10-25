namespace PromiseHub.Application.Imports;

public sealed record Spreadsheet(IReadOnlyList<string> Headers, IReadOnlyList<IReadOnlyList<string>> Rows);
