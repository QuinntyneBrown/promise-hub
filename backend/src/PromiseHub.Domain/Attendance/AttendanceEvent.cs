using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Attendance;

/// <summary>Append-only history of attendance changes. The client action id makes a repeated tap a no-op.</summary>
public sealed class AttendanceEvent : ITenantOwned
{
    public AttendanceEvent(Guid id, Guid organizationId, Guid recordId, AttendanceEventKind kind, DateTimeOffset occurredAt, Guid? actorMembershipId, Guid clientActionId)
    {
        Id = id;
        OrganizationId = organizationId;
        RecordId = recordId;
        Kind = kind;
        OccurredAt = occurredAt;
        ActorMembershipId = actorMembershipId;
        ClientActionId = clientActionId;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid RecordId { get; private set; }
    public AttendanceEventKind Kind { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public Guid? ActorMembershipId { get; private set; }
    public Guid ClientActionId { get; private set; }
}
