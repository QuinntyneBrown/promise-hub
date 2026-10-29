namespace PromiseHub.Application.Imports;

/// <summary>One mapped row: its line in the file and its values by field; the cohort and youth email only when mapped (L2-130).</summary>
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
    string? Notes,
    string? Cohort = null,
    string? YouthEmail = null);
