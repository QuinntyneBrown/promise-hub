using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// The per-tenant send job (L2-034, L2-022 criterion 2): sends each due delivery of a module that is on once through the provider, reserving SMS
/// segments first. A text the cap refuses goes by email when the household has one and is paused otherwise; email never
/// consults the cap. A refused send is retried with backoff and then recorded as failed.
/// </summary>
public sealed class SendQueuedDeliveriesHandler(IPromiseHubDb db, ITenantContext tenant, SmsCap cap, ISmsSender sms, IEmailSender email, IModuleGate modules, TimeProvider clock)
{
    public async Task HandleAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var due = await db.Deliveries.Where(d => d.Status == DeliveryStatus.Queued).ToListAsync(cancellationToken);
        due = [.. due.Where(d => d.DueAt <= now)];
        if (due.Count == 0)
        {
            return;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var messageIds = due.Select(d => d.MessageId).Distinct().ToList();
        var on = await modules.OnAsync(cancellationToken);
        var messages = (await db.Messages.Where(m => messageIds.Contains(m.Id)).ToListAsync(cancellationToken))
            .Where(m => on.Contains(m.Source switch { MessageSource.Slips => ModuleId.Slips, MessageSource.Enrollment => ModuleId.Roster, _ => ModuleId.Messages }))
            .ToDictionary(m => m.Id);
        due = [.. due.Where(d => messages.ContainsKey(d.MessageId))];
        if (due.Count == 0)
        {
            return;
        }
        var period = await cap.CurrentAsync(cancellationToken);

        foreach (var delivery in due)
        {
            var message = messages[delivery.MessageId];
            if (delivery.Channel == Channel.Sms)
            {
                var text = SmsText.For(organization.Name, delivery.Text ?? message.Body);
                var segments = SmsSegments.Count(text);
                if (!period.TryReserve(segments))
                {
                    if (delivery.FallbackEmail is { } address && (await email.SendAsync(address, message.Title, delivery.Text ?? message.Body, cancellationToken)).Ok)
                    {
                        delivery.SentByEmailInstead(now);
                    }
                    else
                    {
                        delivery.Pause("SMS cap reached");
                    }
                }
                else if ((await sms.SendAsync(delivery.To!, text, cancellationToken)).Ok)
                {
                    delivery.Sent(now);
                }
                else
                {
                    period.Release(segments);
                    delivery.Refused(now, "The text provider refused it.");
                }
            }
            else if ((await email.SendAsync(delivery.To!, message.Title, delivery.Text ?? message.Body, cancellationToken)).Ok)
            {
                delivery.Sent(now);
            }
            else
            {
                delivery.Refused(now, "The email provider refused it.");
            }
            // One save per delivery: a crash after a send never sends it again.
            await db.SaveChangesAsync(cancellationToken);
        }

        var stillQueued = await db.Deliveries.Where(d => messageIds.Contains(d.MessageId) && d.Status == DeliveryStatus.Queued)
            .Select(d => d.MessageId).Distinct().ToListAsync(cancellationToken);
        foreach (var message in messages.Values.Where(m => !stillQueued.Contains(m.Id)))
        {
            message.MarkSent();
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
