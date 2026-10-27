namespace PromiseHub.Application.Learning;

/// <summary>A coding lesson or project as the youth works on it (L2-070 criteria 1 and 4): never the leader guide notes.</summary>
public sealed record CodingViewDto(
    Guid Id,
    string Kind,
    string Title,
    string? Body,
    int? Minutes,
    Guid ModuleId,
    string ModuleTitle,
    int Position,
    int LessonCount,
    IReadOnlyList<CodingStepDto> Steps,
    string Code,
    IReadOnlyList<Guid> CheckedStepIds,
    bool Done,
    SubmissionDto? Submission,
    LessonRefDto? Next);
