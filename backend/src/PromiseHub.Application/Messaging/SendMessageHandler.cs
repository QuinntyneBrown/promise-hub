using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// Creates the message and one queued delivery per household in its language; the dispatcher job sends them
/// (L2-021 criterion 3, L2-034). Households the chosen channel cannot reach are recorded as failed with the reason.
/// </summary>
public sealed class SendMessageHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, AudienceResolver resolver, TimeProvider clock)
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

        var now = clock.GetUtcNow();
        var message = new Message(Guid.NewGuid(), tenant.OrganizationId, Message.TitleFrom(body), body, request.Channel, audience.Label,
            request.ProgramId, request.EventId, request.Language, audience.Recipients.Count, now, tenant.ActorName);
        db.Messages.Add(message);
        foreach (var r in audience.Recipients)
        {
            var delivery = new Delivery(Guid.NewGuid(), tenant.OrganizationId, message.Id, r.HouseholdId, r.Household, r.Guardian, r.Language,
                r.Channel, r.To, r.FallbackEmail, now);
            if (r.Unreachable is { } reason)
            {
                delivery.Fail(reason);
            }
            db.Deliveries.Add(delivery);
        }
        audit.Record(new AuditEvent(AuditAction.Created, "Message", message.Id, $"{message.Title} · {audience.Label} · {audience.Recipients.Count} households"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(message.Id);
    }
}
