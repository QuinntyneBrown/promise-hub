namespace PromiseHub.Application.Curriculum;

/// <summary>The organization's curriculum for authors (L2-066 criteria 1 and 7): its tracks and its active programs.</summary>
public sealed record CurriculumDto(IReadOnlyList<CurriculumTrackDto> Tracks, IReadOnlyList<CurriculumProgramDto> Programs);
