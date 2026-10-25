using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>
/// The rules for a slip that goes to guardians: a title and text, a sign-by date before the event, then one message per
/// household of the event's program through the message send job (L2-014 criteria 1, 2 and 4).
/// </summary>
public sealed class SlipSender(IPromiseHubDb db, IAuditWriter audit, AudienceResolver resolver, MessageWriter writer, TimeProvider clock)
{
    private static readonly System.Globalization.CultureInfo Culture = System.Globalization.CultureInfo.GetCultureInfo("en-CA");

    public static Dictionary<string, string> Validate(string title, string body, DateOnly signBy, DateOnly eventDay)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(title))
        {
            errors["title"] = "Enter a slip title.";
        }
        if (string.IsNullOrWhiteSpace(body))
        {
            errors["body"] = "Enter the slip text.";
        }
        if (signBy >= eventDay)
        {
            errors["signBy"] = $"Must be before {eventDay.ToString("ddd d MMM", Culture).Replace(".", string.Empty)}.";
        }
        return errors;
    }

    public async Task SendAsync(PermissionSlip slip, Event e, string why, CancellationToken cancellationToken)
    {
        var request = new AudienceRequest(null, e.Id, null, null, slip.Channel == SlipChannel.EmailOnly ? ChannelChoice.EmailOnly : ChannelChoice.TextWithEmailFallback);
        var audience = await resolver.ResolveAsync(request, cancellationToken);
        var signBy = slip.SignBy.ToString("ddd d MMM", Culture).Replace(".", string.Empty);
        var body = why == "edit"
            ? $"The permission slip for “{slip.Title}” has changed. Please read it and sign again by {signBy}."
            : $"Please sign the permission slip for “{slip.Title}” by {signBy}.";
        var message = writer.Queue(MessageSource.Slips, $"Permission slip: {slip.Title}", body, request.Channel, audience, request);
        if (why == "edit")
        {
            slip.Resent(message.Id);
        }
        else
        {
            slip.Sent(clock.GetUtcNow(), message.Id);
        }
        audit.Record(new AuditEvent(AuditAction.Sent, "PermissionSlip", slip.Id, $"{slip.Title} · {audience.Recipients.Count} households · version {slip.Version}"));
    }

    public async Task<Event?> EventOfAsync(PermissionSlip slip, CancellationToken cancellationToken) =>
        await db.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == slip.EventId, cancellationToken);

    /// <summary>The event's date in the organization's time zone.</summary>
    public async Task<DateOnly> EventDayAsync(Event e, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == e.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(e.StartsAt, zone).DateTime);
    }
}
