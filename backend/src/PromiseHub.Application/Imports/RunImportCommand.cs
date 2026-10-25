namespace PromiseHub.Application.Imports;

/// <summary>Rows (by file line) whose duplicate child should be merged into the existing record instead of skipped.</summary>
public sealed record RunImportCommand(int[]? Merge);
