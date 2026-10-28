namespace PromiseHub.Application.Messaging;

/// <summary>Publishes an event to the open streams of members of one organization (L2-107, ADR 0068); handlers call it after saving.</summary>
public interface IRealtimeEvents
{
    void Publish(Guid organizationId, IEnumerable<Guid> membershipIds, RealtimeEvent realtimeEvent);
}
