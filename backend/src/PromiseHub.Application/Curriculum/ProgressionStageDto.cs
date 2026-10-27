namespace PromiseHub.Application.Curriculum;

/// <summary>A stage of the framework with its competencies in order (L2-086 criterion 1).</summary>
public sealed record ProgressionStageDto(Guid Id, int Position, string Name, string Description, IReadOnlyList<ProgressionCompetencyDto> Competencies);
