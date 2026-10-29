namespace PromiseHub.Application.Imports;

/// <summary>
/// What an import did; the counts add up to the file's rows (imported, skipped as duplicates, or left to fix). Enrolled counts the program
/// for everyone and the cohort places; Invited the youth invitations sent; NotPlaced and NotInvited say which rows and why (L2-130).
/// </summary>
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
    string? ProgramName,
    int Invited = 0,
    IReadOnlyList<ImportRowIssueDto>? NotPlaced = null,
    IReadOnlyList<ImportRowIssueDto>? NotInvited = null);
