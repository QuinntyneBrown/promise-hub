namespace PromiseHub.Application.Learning;

/// <summary>
/// A youth's journey (L2-087 criteria 1 to 3): lessons done of every published lesson of her followed tracks, her weekly streak, the module she is in,
/// each followed track with its modules in order, and the stages of her organization's progression framework.
/// </summary>
public sealed record JourneyDto(int CompletedLessons, int TotalLessons, int StreakWeeks, JourneyCurrentDto? Current, IReadOnlyList<JourneyTrackDto> Tracks,
    IReadOnlyList<JourneyStageDto> Stages);
