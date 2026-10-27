namespace PromiseHub.Application.Learning;

/// <summary>One competency of the framework with its stage and her latest assessed level (L2-088 criterion 1).</summary>
public sealed record CompetencyLevelDto(Guid Id, string Name, string? Stage, string Level);
