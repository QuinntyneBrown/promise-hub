namespace PromiseHub.Application.Incidents;

/// <summary>The incidents the reader may see: the whole log for supervisors, their own reports for everyone else.</summary>
public sealed record IncidentListDto(bool CanReadLog, IReadOnlyList<IncidentSummaryDto> Incidents);
