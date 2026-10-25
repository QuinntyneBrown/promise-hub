using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// Queues a message: the message and one delivery per household of the audience, in its language and channel, for the
/// send job. Households the channel cannot reach get a failed delivery with the reason. The caller saves.
/// </summary>
public sealed class MessageWriter(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public Message Queue(MessageSource source, string title, string body, ChannelChoice channel, Audience audience, AudienceRequest request, Func<Recipient, string?>? textFor = null)
    {
        var now = clock.GetUtcNow();
        var message = new Message(Guid.NewGuid(), tenant.OrganizationId, title, body, channel, audience.Label,
            request.ProgramId, request.EventId, request.Language, audience.Recipients.Count, now, tenant.ActorName, source);
        db.Messages.Add(message);
        foreach (var r in audience.Recipients)
        {
            var delivery = new Delivery(Guid.NewGuid(), tenant.OrganizationId, message.Id, r.HouseholdId, r.Household, r.Guardian, r.Language,
                r.Channel, r.To, r.FallbackEmail, now);
            if (r.Unreachable is { } reason)
            {
                delivery.Fail(reason);
            }
            if (textFor?.Invoke(r) is { } text)
            {
                delivery.Personalize(text);
            }
            db.Deliveries.Add(delivery);
        }
        return message;
    }
}
