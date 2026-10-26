using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Surveys;

/// <summary>A two-question survey sent to guardians after an event (L2-043). It closes a week after it is sent.</summary>
public sealed class Survey : ITenantOwned
{
    public static readonly TimeSpan Open = TimeSpan.FromDays(7);

    public Survey(Guid id, Guid organizationId, Guid eventId, string sentBy, DateTimeOffset sentAt)
    {
        Id = id;
        OrganizationId = organizationId;
        EventId = eventId;
        SentBy = sentBy;
        SentAt = sentAt;
        ClosesAt = sentAt + Open;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid EventId { get; private set; }
    public string SentBy { get; private set; }
    public DateTimeOffset SentAt { get; private set; }
    public DateTimeOffset ClosesAt { get; private set; }
}
