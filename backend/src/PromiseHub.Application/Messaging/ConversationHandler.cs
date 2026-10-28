using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// One conversation (L2-106 criterion 2, L2-108 criterion 4): a participant reads it and what was sent to her is marked read; a supervisor
/// reads every message of the youth, read only, marks nothing read, and the opening is audited.
/// </summary>
public sealed class ConversationHandler(IPromiseHubDb db, ITenantContext tenant, ConversationAccess access, IAuditWriter audit, TimeProvider clock)
{
    public async Task<(ResultStatus Status, ConversationDto? Conversation)> HandleAsync(Guid youthId, CancellationToken cancellationToken = default)
    {
        var scope = await access.ForAsync(youthId, cancellationToken);
        if (scope is null || (scope.Mentor is null && !scope.IsSupervisor))
        {
            return (ResultStatus.NotFound, null);
        }
        if (!scope.IsParticipant && !scope.IsSupervisor)
        {
            return (ResultStatus.Forbidden, null);
        }
        var me = tenant.MembershipId;
        var query = db.DirectMessages.Where(d => d.YouthMembershipId == youthId);
        if (scope.IsParticipant)
        {
            query = query.Where(d => d.MentorMembershipId == scope.Mentor!.Id);
        }
        var messages = (await query.ToListAsync(cancellationToken)).OrderBy(d => d.SentAt).ToList();
        var senders = messages.Select(d => d.SenderMembershipId).Distinct().ToList();
        var names = await db.Memberships.AsNoTracking().Where(m => senders.Contains(m.Id)).ToDictionaryAsync(m => m.Id, m => m.PersonName, cancellationToken);
        if (scope.IsParticipant)
        {
            var now = clock.GetUtcNow();
            foreach (var unread in messages.Where(d => d.SenderMembershipId != me && d.ReadAt == null))
            {
                unread.MarkRead(now);
            }
        }
        else
        {
            audit.Record(new AuditEvent(AuditAction.Viewed, "Conversation", youthId,
                $"{scope.Youth.PersonName} and {scope.Mentor?.PersonName ?? "former mentors"}"));
        }
        await db.SaveChangesAsync(cancellationToken);
        var items = messages.Select(d => new DirectMessageDto(d.Id, d.Body, names.GetValueOrDefault(d.SenderMembershipId, ""), d.SenderMembershipId == me, d.SentAt)).ToList();
        return (ResultStatus.Done, new ConversationDto(scope.Youth.Id, scope.Youth.PersonName, scope.Mentor?.Id, scope.Mentor?.PersonName, !scope.IsParticipant,
            scope.CanSend, scope.Blocked, items));
    }
}
