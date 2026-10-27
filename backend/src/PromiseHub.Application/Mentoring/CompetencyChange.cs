namespace PromiseHub.Application.Mentoring;

/// <summary>One competency's level (NotStarted, Developing, Proficient or Mastered) and note as the page saves it.</summary>
public sealed record CompetencyChange(Guid CompetencyId, string? Level, string? Notes);
