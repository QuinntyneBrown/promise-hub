using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Attendance;

/// <summary>
/// The text sent to a child's household when the child is not checked in after the no-show delay; recorded before the send
/// so a retried job never texts twice, and updated with the guardian's reply (L2-018 criteria 1 and 2).
/// </summary>
public sealed class NoShowAlert : ITenantOwned
{
    public NoShowAlert(Guid id, Guid organizationId, Guid eventId, Guid childId, Guid householdId, DateTimeOffset sentAt)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        ChildId = childId;
        HouseholdId = householdId;
        SentAt = sentAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public DateTimeOffset SentAt { get; private set; }
    public NoShowReply Reply { get; private set; }
    public DateTimeOffset? RepliedAt { get; private set; }

    public void Replied(NoShowReply reply, DateTimeOffset now)
    {
        Reply = reply;
        RepliedAt = now;
    }
}
