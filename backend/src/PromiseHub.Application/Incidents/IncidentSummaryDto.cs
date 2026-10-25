namespace PromiseHub.Application.Incidents;

public sealed record IncidentSummaryDto(Guid Id, string Category, string Child, DateTimeOffset OccurredAt, string Severity, string Status, string ReportedBy);
