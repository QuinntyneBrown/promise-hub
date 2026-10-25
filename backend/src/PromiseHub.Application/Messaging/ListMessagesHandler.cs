using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Messaging;

/// <summary>Messages, newest first, with their delivery counts and this month's SMS use.</summary>
public sealed class ListMessagesHandler(IPromiseHubDb db, SmsCap cap)
{
    public async Task<MessageListDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var messages = await db.Messages.AsNoTracking().ToListAsync(cancellationToken);
        var statuses = await db.Deliveries.AsNoTracking().Select(d => new { d.MessageId, d.Status }).ToListAsync(cancellationToken);
        var period = await cap.CurrentAsync(cancellationToken);
        var rows = messages.OrderByDescending(m => m.CreatedAt).Select(m =>
        {
            var counts = DeliveryCounts.Of(statuses.Where(s => s.MessageId == m.Id).Select(s => s.Status));
            return new MessageRowDto(m.Id, m.Title, m.CreatedAt, m.CreatedBy, m.RecipientCount, m.Audience, m.Channel.ToString(),
                m.Status.ToString(), counts.Delivered, counts.Failed, counts.Paused);
        }).ToList();
        return new MessageListDto(rows, period.Used, period.Cap);
    }
}
