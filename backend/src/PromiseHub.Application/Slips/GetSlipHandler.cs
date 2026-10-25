using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Slips;

/// <summary>An event's slip with who it reaches, the answers so far and how the latest send went.</summary>
public sealed class GetSlipHandler(IPromiseHubDb db, SlipReader reader)
{
    public async Task<SlipDto?> HandleAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        var slip = e is null ? null : await db.PermissionSlips.AsNoTracking().FirstOrDefaultAsync(s => s.EventId == eventId, cancellationToken);
        if (e is null || slip is null)
        {
            return null;
        }
        var responses = await reader.ResponsesAsync(slip, e.ProgramId, cancellationToken);
        SlipDeliveryDto? delivery = null;
        if (slip.MessageId is { } messageId)
        {
            var deliveries = await db.Deliveries.AsNoTracking().Where(d => d.MessageId == messageId).ToListAsync(cancellationToken);
            List<string> Of(DeliveryStatus status) => [.. deliveries.Where(d => d.Status == status).Select(d => d.Household).Order()];
            delivery = new SlipDeliveryDto(deliveries.Count(d => d.Status == DeliveryStatus.Sent), Of(DeliveryStatus.FellBackToEmail),
                Of(DeliveryStatus.Paused), Of(DeliveryStatus.Failed));
        }
        return new SlipDto(slip.Id, e.Id, e.Name, e.StartsAt, string.IsNullOrEmpty(slip.Title) ? e.Name : slip.Title, slip.Body, slip.SignBy,
            slip.AskPhotos, slip.AskSwimming, slip.AskLunch, slip.Reminders.ToString(), slip.Channel.ToString(), slip.Status.ToString(),
            slip.ScheduledFor, slip.SentAt, slip.Version, responses.Select(r => r.Household).Distinct().Count(), responses.Count,
            responses.Count(r => r.Status == "Signed"), responses.Count(r => r.Status == "Declined"), responses.Count(r => r.Status == "Outstanding"),
            responses, delivery);
    }
}
