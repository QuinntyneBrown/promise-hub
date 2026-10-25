using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

public sealed class GetMessageHandler(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<MessageDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var m = await db.Messages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (m is null)
        {
            return null;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var deliveries = await db.Deliveries.AsNoTracking().Where(d => d.MessageId == id).ToListAsync(cancellationToken);
        var counts = DeliveryCounts.Of(deliveries.Select(d => d.Status));
        var text = SmsText.For(organization.Name, m.Body);
        var rows = deliveries
            .OrderBy(d => d.Status is DeliveryStatus.Failed or DeliveryStatus.Paused ? 0 : 1)
            .ThenBy(d => d.Household)
            .Select(d => new DeliveryDto(d.Household, d.Guardian, d.Channel.ToString(), d.Language, d.Status.ToString(), d.Reason, d.SentAt))
            .ToList();
        return new MessageDto(m.Id, m.Title, m.Body, text, text.Length, SmsSegments.Count(text), m.CreatedAt, m.CreatedBy, m.Audience,
            m.Channel.ToString(), m.Status.ToString(), m.RecipientCount, counts.Delivered, counts.Failed, counts.Paused,
            [.. deliveries.Select(d => d.Language).Distinct().Order()], rows);
    }
}
