namespace PromiseHub.Application.Learning;

/// <summary>
/// One stage of the progression framework as the youth stands with it (L2-087 criterion 3, ADR 0059): <see cref="Status"/> is earned, current or
/// ahead; <see cref="Proficient"/> counts its competencies at Proficient or Mastered.
/// </summary>
public sealed record JourneyStageDto(Guid Id, string Name, string Description, string Status, int Proficient, IReadOnlyList<string> Competencies);
