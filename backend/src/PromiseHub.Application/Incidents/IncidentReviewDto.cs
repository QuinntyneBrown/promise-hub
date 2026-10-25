namespace PromiseHub.Application.Incidents;

public sealed record IncidentReviewDto(string Note, string Outcome, string By, DateTimeOffset At);
