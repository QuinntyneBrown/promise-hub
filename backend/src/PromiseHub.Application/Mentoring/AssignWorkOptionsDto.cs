namespace PromiseHub.Application.Mentoring;

/// <summary>What the mentor may assign and to whom (L2-092 criterion 1).</summary>
public sealed record AssignWorkOptionsDto(IReadOnlyList<AssignWorkItemDto> Items, IReadOnlyList<AssignWorkYouthDto> Youth, IReadOnlyList<AssignWorkCohortDto> Cohorts);
