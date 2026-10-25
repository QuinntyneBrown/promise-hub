using PromiseHub.Domain.Incidents;

namespace PromiseHub.Application.Incidents;

public sealed record ReviewIncidentCommand(string? Note, ReviewOutcome? Outcome);
