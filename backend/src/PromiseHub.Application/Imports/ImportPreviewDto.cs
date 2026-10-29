namespace PromiseHub.Application.Imports;

/// <summary>
/// What an import will do: duplicates, rows that need a look (including rows not placed or not invited, with why), the program for everyone,
/// and how many rows a Cohort column places and a Youth email column invites (L2-010, L2-130).
/// </summary>
public sealed record ImportPreviewDto(int Rows, IReadOnlyList<ImportRowIssueDto> Duplicates, IReadOnlyList<ImportRowIssueDto> NeedLook, string? ProgramName,
    int Placements = 0, int Invitations = 0);
