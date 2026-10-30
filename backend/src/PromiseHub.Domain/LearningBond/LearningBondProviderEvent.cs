using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>A provider event already applied (L2-150 criterion 4): the provider and its event id are unique, so a repeat changes nothing.</summary>
public sealed class LearningBondProviderEvent : ITenantOwned
{
    public LearningBondProviderEvent(Guid id, Guid organizationId, string provider, string eventId, Guid applicationId, string kind, DateTimeOffset receivedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        Provider = provider;
        EventId = eventId;
        ApplicationId = applicationId;
        Kind = kind;
        ReceivedAt = receivedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Provider { get; private set; }
    public string EventId { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string Kind { get; private set; }
    public DateTimeOffset ReceivedAt { get; private set; }
}
