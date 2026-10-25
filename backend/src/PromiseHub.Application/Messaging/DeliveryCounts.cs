using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>Delivered counts texts and emails that went out, including those sent by email because of the cap.</summary>
public sealed record DeliveryCounts(int Delivered, int Failed, int Paused)
{
    public static DeliveryCounts Of(IEnumerable<DeliveryStatus> statuses)
    {
        var list = statuses.ToList();
        return new DeliveryCounts(
            list.Count(s => s is DeliveryStatus.Sent or DeliveryStatus.FellBackToEmail),
            list.Count(s => s == DeliveryStatus.Failed),
            list.Count(s => s == DeliveryStatus.Paused));
    }
}
