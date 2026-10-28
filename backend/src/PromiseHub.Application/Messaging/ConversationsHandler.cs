using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// The reader's conversations (L2-106 criterion 1, L2-108 criterion 4): a mentor's one per youth account he mentors, a youth's one with her
/// mentor, and for admins and program directors every conversation of the organization that has a message.
/// </summary>
public sealed class ConversationsHandler(IPromiseHubDb db, ITenantContext tenant, ConsentGate consent)
{
    public async Task<ConversationListDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var me = tenant.MembershipId;
        var rows = new List<ConversationRowDto>();
        if (tenant.Role is Role.Mentor or Role.Youth)
        {
            var children = tenant.Role == Role.Mentor
                ? await db.YouthMentors.AsNoTracking().Where(y => y.MentorMembershipId == me).Select(y => y.ChildId).ToListAsync(cancellationToken)
                : await db.Memberships.AsNoTracking().Where(m => m.Id == me && m.ChildId != null).Select(m => m.ChildId!.Value).ToListAsync(cancellationToken);
            var youth = await db.Memberships.AsNoTracking()
                .Where(m => m.Role == Role.Youth && m.RemovedAt == null && m.ChildId != null && children.Contains(m.ChildId.Value)).ToListAsync(cancellationToken);
            var assignments = await db.YouthMentors.AsNoTracking().Where(y => children.Contains(y.ChildId)).ToListAsync(cancellationToken);
            var mentorIds = assignments.Select(a => a.MentorMembershipId).Distinct().ToList();
            var mentors = await db.Memberships.AsNoTracking().Where(m => mentorIds.Contains(m.Id) && m.Role == Role.Mentor && m.RemovedAt == null)
                .ToDictionaryAsync(m => m.Id, cancellationToken);
            foreach (var y in youth)
            {
                var assignment = assignments.FirstOrDefault(a => a.ChildId == y.ChildId);
                if (assignment is null || !mentors.TryGetValue(assignment.MentorMembershipId, out var mentor))
                {
                    continue;
                }
                var messages = await db.DirectMessages.AsNoTracking()
                    .Where(d => d.YouthMembershipId == y.Id && d.MentorMembershipId == mentor.Id).ToListAsync(cancellationToken);
                rows.Add(Row(y, mentor, messages, me, await consent.GatedAsync(y.Id, cancellationToken)));
            }
        }
        else if (RolePermissions.Has(tenant.Role, Permission.SuperviseConversations))
        {
            var messages = await db.DirectMessages.AsNoTracking().ToListAsync(cancellationToken);
            var ids = messages.SelectMany(d => new[] { d.YouthMembershipId, d.MentorMembershipId }).Distinct().ToList();
            var people = await db.Memberships.AsNoTracking().Where(m => ids.Contains(m.Id)).ToDictionaryAsync(m => m.Id, cancellationToken);
            foreach (var group in messages.GroupBy(d => d.YouthMembershipId))
            {
                var latest = group.MaxBy(d => d.SentAt)!;
                rows.Add(Row(people[group.Key], people[latest.MentorMembershipId], [.. group], me, await consent.GatedAsync(group.Key, cancellationToken)) with { Unread = 0 });
            }
        }
        return new ConversationListDto([.. rows.OrderByDescending(r => r.LastMessageAt ?? DateTimeOffset.MinValue).ThenBy(r => r.YouthName, StringComparer.Ordinal)]);
    }

    private static ConversationRowDto Row(Membership youth, Membership mentor, List<DirectMessage> messages, Guid me, bool gated)
    {
        var last = messages.MaxBy(d => d.SentAt);
        return new ConversationRowDto(youth.Id, youth.PersonName, mentor.Id, mentor.PersonName, last?.Body, last?.SenderMembershipId == me, last?.SentAt,
            messages.Count(d => d.SenderMembershipId != me && d.ReadAt == null), gated ? "consent" : null);
    }
}
