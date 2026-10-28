using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// Sends a direct message (L2-106 criteria 3 to 6, L2-108): only the youth or her current mentor, never while a guardian's consent is needed,
/// 1 to 2,000 characters kept as plain text; audited with the two names and never the words.
/// </summary>
public sealed class SendDirectMessageHandler(IPromiseHubDb db, ITenantContext tenant, ConversationAccess access, IAuditWriter audit, TimeProvider clock)
{
    public async Task<SendDirectMessageOutcome> HandleAsync(Guid youthId, SendDirectMessageRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ForAsync(youthId, cancellationToken);
        if (scope is null)
        {
            return new(Result.NotFound);
        }
        if (!scope.IsParticipant)
        {
            return new(Result.Forbidden);
        }
        if (scope.Blocked is { } reason)
        {
            return new(Result.Conflict, Blocked: reason);
        }
        var body = request.Body?.Trim() ?? string.Empty;
        if (body.Length == 0)
        {
            return new(Result.Invalid(new Dictionary<string, string> { ["body"] = "Write a message." }));
        }
        if (body.Length > DirectMessage.MaximumBody)
        {
            return new(Result.Invalid(new Dictionary<string, string> { ["body"] = "Keep it to 2,000 characters." }));
        }
        var mentor = scope.Mentor!;
        var message = new DirectMessage(Guid.NewGuid(), tenant.OrganizationId, scope.Youth.Id, mentor.Id, tenant.MembershipId, body, clock.GetUtcNow());
        db.DirectMessages.Add(message);
        var (from, to) = tenant.MembershipId == mentor.Id ? (mentor.PersonName, scope.Youth.PersonName) : (scope.Youth.PersonName, mentor.PersonName);
        audit.Record(new AuditEvent(AuditAction.Created, "DirectMessage", message.Id, $"Message from {from} to {to}"));
        await db.SaveChangesAsync(cancellationToken);
        return new(Result.Created(message.Id), new DirectMessageDto(message.Id, body, tenant.ActorName, true, message.SentAt));
    }
}
