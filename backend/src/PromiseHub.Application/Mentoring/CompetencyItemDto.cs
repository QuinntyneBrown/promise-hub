namespace PromiseHub.Application.Mentoring;

/// <summary>One competency with the youth's latest level and note, who set it and when; NotStarted with nothing else when never assessed.</summary>
public sealed record CompetencyItemDto(Guid Id, string Name, string Description, string Level, string? Notes, string? AssessedBy, DateTimeOffset? AssessedAt);
