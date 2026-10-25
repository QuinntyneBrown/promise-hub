using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>Counts the audience by channel and prices the text against the SMS cap (L2-021 criteria 1 and 2, L2-022 criterion 1).</summary>
public sealed class PreviewMessageHandler(IPromiseHubDb db, ITenantContext tenant, AudienceResolver resolver, SmsCap cap)
{
    public async Task<MessagePreviewDto> HandleAsync(AudienceRequest request, CancellationToken cancellationToken = default)
    {
        var audience = await resolver.ResolveAsync(request, cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var text = SmsText.For(organization.Name, request.Body ?? string.Empty);
        var segments = SmsSegments.Count(text);
        var reachable = audience.Recipients.Where(r => r.Unreachable is null).ToList();
        var texts = reachable.Where(r => r.Channel == Channel.Sms).ToList();
        var remaining = (await cap.CurrentAsync(cancellationToken)).Remaining;
        var textable = remaining / segments;
        var fallingBack = texts.Skip(textable).Count(r => r.FallbackEmail is not null);
        return new MessagePreviewDto(
            audience.Recipients.Count,
            texts.Count,
            reachable.Count - texts.Count,
            audience.Recipients.Count - reachable.Count,
            text.Length,
            segments,
            texts.Count * segments,
            remaining,
            fallingBack);
    }
}
