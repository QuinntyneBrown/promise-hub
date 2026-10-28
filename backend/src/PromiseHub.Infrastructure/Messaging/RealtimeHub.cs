using System.Collections.Concurrent;
using PromiseHub.Application.Messaging;

namespace PromiseHub.Infrastructure.Messaging;

/// <summary>
/// The open event streams of this API instance (L2-107, ADR 0068), keyed by organization and membership, so an event reaches only the
/// members of the organization it names. A single instance holds them; more instances need a shared broker behind the same port.
/// </summary>
public sealed class RealtimeHub : IRealtimeEvents
{
    private readonly ConcurrentDictionary<RealtimeSubscription, byte> _subscriptions = new();

    public RealtimeSubscription Subscribe(Guid organizationId, Guid membershipId)
    {
        var subscription = new RealtimeSubscription(organizationId, membershipId, s => _subscriptions.TryRemove(s, out _));
        _subscriptions.TryAdd(subscription, 0);
        return subscription;
    }

    public void Publish(Guid organizationId, IEnumerable<Guid> membershipIds, RealtimeEvent realtimeEvent)
    {
        var members = membershipIds.ToHashSet();
        foreach (var subscription in _subscriptions.Keys.Where(s => s.OrganizationId == organizationId && members.Contains(s.MembershipId)))
        {
            subscription.Write(realtimeEvent);
        }
    }
}
