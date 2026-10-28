using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Events;

/// <summary>A youth's RSVP to a session (L2-094, ADR 0064): one per event and child; answering again replaces the answer and note.</summary>
public sealed class EventRsvp : ITenantOwned
{
    public const int MaximumNote = 500;

    public EventRsvp(Guid id, Guid organizationId, Guid eventId, Guid childId, RsvpResponse response, string? note, DateTimeOffset answeredAt)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        ChildId = childId;
        Response = response;
        Note = note;
        AnsweredAt = answeredAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public Guid ChildId { get; private set; }
    public RsvpResponse Response { get; private set; }

    /// <summary>For the staff who run the session; never audited.</summary>
    public string? Note { get; private set; }

    public DateTimeOffset AnsweredAt { get; private set; }

    public void Answer(RsvpResponse response, string? note, DateTimeOffset at)
    {
        Response = response;
        Note = note;
        AnsweredAt = at;
    }
}
