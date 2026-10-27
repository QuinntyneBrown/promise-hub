namespace PromiseHub.Application.Learning;

/// <summary>One followed track on the journey's roadmap, with its published modules in order (L2-087 criterion 1).</summary>
public sealed record JourneyTrackDto(Guid Id, string Name, int CompletedLessons, int TotalLessons, IReadOnlyList<ModuleItemDto> Modules);
