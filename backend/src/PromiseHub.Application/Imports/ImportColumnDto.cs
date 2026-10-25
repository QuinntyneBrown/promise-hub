namespace PromiseHub.Application.Imports;

/// <summary>A column of the file, a sample value, and the field it was matched to (null when unmatched).</summary>
public sealed record ImportColumnDto(string Name, string? Sample, string? Field);
