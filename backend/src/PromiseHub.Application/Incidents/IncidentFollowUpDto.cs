namespace PromiseHub.Application.Incidents;

public sealed record IncidentFollowUpDto(string Text, string By, DateTimeOffset At);
