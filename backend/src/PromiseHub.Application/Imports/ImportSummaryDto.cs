namespace PromiseHub.Application.Imports;

/// <summary>What an import did; the counts add up to the file's rows (imported, skipped as duplicates, or left to fix).</summary>
public sealed record ImportSummaryDto(
    string FileName,
    int Rows,
    int Imported,
    int FamiliesCreated,
    int FamiliesUpdated,
    int Children,
    int Enrolled,
    int Skipped,
    int NeedFix,
    IReadOnlyList<ImportRowIssueDto> ToFix,
    string? ProgramName);
