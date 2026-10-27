namespace PromiseHub.Application.Curriculum;

/// <summary>The organization's progression framework, its stages in order.</summary>
public sealed record ProgressionDto(IReadOnlyList<ProgressionStageDto> Stages);
