namespace PromiseHub.Application.Curriculum;

/// <summary>One lesson for the lesson editor, leader notes included (authors only, L2-067 criteria 2 and 5).</summary>
public sealed record LessonDetailDto(
    Guid Id,
    Guid ModuleId,
    string ModuleTitle,
    Guid TrackId,
    string TrackName,
    string Title,
    string? Reading,
    int? Minutes,
    IReadOnlyList<string> Objectives,
    string? Body,
    IReadOnlyList<string> Prompts,
    string? LeaderNotes,
    string Status,
    int Position,
    int LessonCount,
    LessonVideoDto? Video);
