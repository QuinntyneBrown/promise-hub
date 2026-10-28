using System.Threading.Channels;
using PromiseHub.Application.Messaging;

namespace PromiseHub.Infrastructure.Messaging;

/// <summary>One open event stream: the events for its member, until it is disposed.</summary>
public sealed class RealtimeSubscription(Guid organizationId, Guid membershipId, Action<RealtimeSubscription> remove) : IDisposable
{
    private readonly Channel<RealtimeEvent> _events = Channel.CreateBounded<RealtimeEvent>(
        new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.DropOldest, SingleReader = true });

    public Guid OrganizationId { get; } = organizationId;
    public Guid MembershipId { get; } = membershipId;
    public ChannelReader<RealtimeEvent> Reader => _events.Reader;

    internal void Write(RealtimeEvent realtimeEvent) => _events.Writer.TryWrite(realtimeEvent);

    public void Dispose()
    {
        _events.Writer.TryComplete();
        remove(this);
    }
}
