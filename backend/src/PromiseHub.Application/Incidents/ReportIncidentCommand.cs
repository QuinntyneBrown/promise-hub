using PromiseHub.Domain.Incidents;

namespace PromiseHub.Application.Incidents;

public sealed record ReportIncidentCommand(IncidentCategory? Category, Guid? ChildId, DateTimeOffset? OccurredAt, string? Place, string? WhatHappened,
    string? ActionTaken, GuardianContactStatus? GuardianContact, IncidentSeverity? Severity);
