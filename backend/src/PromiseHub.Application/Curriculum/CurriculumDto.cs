namespace PromiseHub.Application.Curriculum;

/// <summary>The organization's curriculum for authors (L2-066 criterion 1).</summary>
public sealed record CurriculumDto(IReadOnlyList<CurriculumTrackDto> Tracks);
