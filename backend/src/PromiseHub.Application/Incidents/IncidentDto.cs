namespace PromiseHub.Application.Incidents;

/// <summary>One incident as its reporter or a supervisor reads it (page: incident).</summary>
public sealed record IncidentDto(Guid Id, string Category, Guid ChildId, string Child, DateTimeOffset OccurredAt, string Place, string WhatHappened,
    string ActionTaken, string GuardianContact, string Severity, string Status, string ReportedBy, DateTimeOffset ReportedAt);
