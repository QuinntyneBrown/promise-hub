namespace PromiseHub.Application.Mentoring;

/// <summary>One of the mentor's youth to assign to (L2-092 criterion 1): the cohorts they are on, the tracks they follow, an open at-risk flag.</summary>
public sealed record AssignWorkYouthDto(Guid Id, string Name, string Cohorts, IReadOnlyList<Guid> TrackIds, bool AtRisk);
