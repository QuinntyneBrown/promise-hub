namespace PromiseHub.Application.Learning;

/// <summary>One lesson as a youth reads it (L2-069 criteria 1 and 2): never the leader guide notes.</summary>
public sealed record LessonViewDto(
    Guid Id,
    string Kind,
    string Title,
    string? Reading,
    string? Passage,
    int? Minutes,
    IReadOnlyList<string> Objectives,
    string? Body,
    IReadOnlyList<string> Prompts,
    Guid ModuleId,
    string ModuleTitle,
    Guid TrackId,
    string TrackName,
    int Position,
    int LessonCount,
    bool HasVideo,
    bool Done,
    LessonRefDto? Next);
