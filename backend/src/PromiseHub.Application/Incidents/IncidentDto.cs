namespace PromiseHub.Application.Incidents;

/// <summary>One incident as its reporter or a supervisor reads it (page: incident), with the review, follow-ups and trail.</summary>
public sealed record IncidentDto(Guid Id, string Category, Guid ChildId, string Child, DateTimeOffset OccurredAt, string Place, string WhatHappened,
    string ActionTaken, string GuardianContact, string Severity, string Status, string ReportedBy, DateTimeOffset ReportedAt, bool CanReview,
    IncidentReviewDto? Review, IReadOnlyList<IncidentFollowUpDto> FollowUps, IReadOnlyList<IncidentTrailDto> Trail);
