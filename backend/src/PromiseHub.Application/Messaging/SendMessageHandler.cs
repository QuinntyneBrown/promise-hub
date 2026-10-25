using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// Creates the message and one queued delivery per household in its language; the dispatcher job sends them
/// (L2-021 criterion 3, L2-034). Households the chosen channel cannot reach are recorded as failed with the reason.
/// </summary>
public sealed class SendMessageHandler(IPromiseHubDb db, IAuditWriter audit, AudienceResolver resolver, MessageWriter writer)
{
    public const int MaxLength = 480;

    public async Task<Result> HandleAsync(AudienceRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        var body = request.Body?.Trim() ?? string.Empty;
        if (body.Length == 0)
        {
            errors["body"] = "Enter a message.";
        }
        else if (body.Length > MaxLength)
        {
            errors["body"] = $"Keep it to {MaxLength} characters.";
        }
        var audience = await resolver.ResolveAsync(request, cancellationToken);
        if (audience.Recipients.Count == 0)
        {
            errors["audience"] = "Nobody matches. Loosen a filter.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var message = writer.Queue(MessageSource.Messages, Message.TitleFrom(body), body, request.Channel, audience, request);
        audit.Record(new AuditEvent(AuditAction.Created, "Message", message.Id, $"{message.Title} · {audience.Label} · {audience.Recipients.Count} households"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(message.Id);
    }
}
