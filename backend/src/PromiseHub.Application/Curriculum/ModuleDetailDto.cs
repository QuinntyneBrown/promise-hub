namespace PromiseHub.Application.Curriculum;

/// <summary>One module for the module editor (L2-066 criterion 4): its fields, place in the track and the earlier modules it may require.</summary>
public sealed record ModuleDetailDto(
    Guid Id,
    Guid TrackId,
    string TrackName,
    string Title,
    string? Description,
    Guid? PrerequisiteModuleId,
    string? Anchor,
    string Status,
    int Position,
    int ModuleCount,
    IReadOnlyList<ModuleRefDto> EarlierModules,
    IReadOnlyList<LessonSummaryDto> Lessons,
    IReadOnlyList<string> Programs);
