namespace PromiseHub.Application.Curriculum;

/// <summary>A track with its modules in the order youth see and the active programs that follow it.</summary>
public sealed record CurriculumTrackDto(
    Guid Id,
    string Name,
    string Key,
    string? Description,
    string Status,
    IReadOnlyList<CurriculumModuleSummaryDto> Modules,
    IReadOnlyList<ProgramRefDto> FollowedBy);
