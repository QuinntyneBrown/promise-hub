namespace PromiseHub.Application.Mentoring;

/// <summary>Every competency's level and note as the mentor left them (L2-082 criterion 2).</summary>
public sealed record SaveCompetenciesRequest(IReadOnlyList<CompetencyChange>? Items);
