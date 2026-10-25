namespace PromiseHub.Application.Incidents;

/// <summary>One line of the incident's trail, from the audit log: who did what, when.</summary>
public sealed record IncidentTrailDto(string Text, DateTimeOffset At);
