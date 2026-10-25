namespace PromiseHub.Application.Imports;

/// <summary>One mapped row: its line in the file and its values by field.</summary>
public sealed record ImportRow(
    int Line,
    string ChildName,
    DateOnly? DateOfBirth,
    string? School,
    string? GuardianName,
    string? Phone,
    string? Email,
    string? Allergies,
    string? Language,
    string? Notes);
