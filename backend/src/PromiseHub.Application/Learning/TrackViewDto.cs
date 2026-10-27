namespace PromiseHub.Application.Learning;

/// <summary>A track as a youth sees it (L2-068 criterion 2), with every track of theirs for the switch.</summary>
public sealed record TrackViewDto(Guid Id, string Name, string? Description, int CompletedLessons, int TotalLessons, IReadOnlyList<TrackRefDto> Tracks, IReadOnlyList<ModuleItemDto> Modules);
