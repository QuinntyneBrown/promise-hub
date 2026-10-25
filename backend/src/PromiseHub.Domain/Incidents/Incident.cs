using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Incidents;

/// <summary>
/// Something that happened to or involving a child during a program, reported by a staff member and reviewed by a
/// supervisor (L2-023). Only supervisors and the reporter can read it.
/// </summary>
public sealed class Incident : ITenantOwned
{
    public Incident(Guid id, Guid organizationId, IncidentCategory category, Guid childId, DateTimeOffset occurredAt, string place, string whatHappened,
        string actionTaken, GuardianContactStatus guardianContact, IncidentSeverity severity, Guid reporterId, string reportedBy, DateTimeOffset reportedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Category = category;
        ChildId = childId;
        OccurredAt = occurredAt;
        Place = place;
        WhatHappened = whatHappened;
        ActionTaken = actionTaken;
        GuardianContact = guardianContact;
        Severity = severity;
        ReporterId = reporterId;
        ReportedBy = reportedBy;
        ReportedAt = reportedAt;
        Status = IncidentStatus.NeedsReview;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public IncidentCategory Category { get; private set; }
    public Guid ChildId { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public string Place { get; private set; }
    public string WhatHappened { get; private set; }
    public string ActionTaken { get; private set; }
    public GuardianContactStatus GuardianContact { get; private set; }
    public IncidentSeverity Severity { get; private set; }
    public IncidentStatus Status { get; private set; }

    /// <summary>The membership of the staff member who reported it.</summary>
    public Guid ReporterId { get; private set; }

    public string ReportedBy { get; private set; }
    public DateTimeOffset ReportedAt { get; private set; }
}
