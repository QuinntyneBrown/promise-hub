namespace PromiseHub.Application.Curriculum;

/// <summary>A competency of a stage, as mentors assess it.</summary>
public sealed record ProgressionCompetencyDto(Guid Id, string Name, string Description);
