using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// The safeguards every direct message obeys (L2-106 criterion 6, L2-108, ADR 0068): a conversation is a youth account of the active
/// organization and the mentor assigned to her child; only those two write; admins and program directors read; a minor without a guardian's
/// consent in force is blocked both ways.
/// </summary>
public sealed class ConversationAccess(IPromiseHubDb db, ITenantContext tenant, ConsentGate consent)
{
    /// <summary>Null when the id is not an active youth account of this organization (404).</summary>
    public async Task<ConversationScope?> ForAsync(Guid youthId, CancellationToken cancellationToken = default)
    {
        var youth = await db.Memberships.AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == youthId && m.Role == Role.Youth && m.RemovedAt == null && m.ChildId != null, cancellationToken);
        if (youth is null)
        {
            return null;
        }
        var mentor = await MentorOfAsync(youth, cancellationToken);
        var participant = mentor is not null && (tenant.MembershipId == youth.Id || tenant.MembershipId == mentor.Id);
        var supervisor = RolePermissions.Has(tenant.Role, Permission.SuperviseConversations);
        var blocked = await consent.GatedAsync(youth.Id, cancellationToken) ? "consent" : null;
        return new ConversationScope(youth, mentor, participant, supervisor, blocked);
    }

    /// <summary>The active mentor membership assigned to the youth's child, if any.</summary>
    public async Task<Membership?> MentorOfAsync(Membership youth, CancellationToken cancellationToken = default)
    {
        var mentorId = await db.YouthMentors.AsNoTracking().Where(y => y.ChildId == youth.ChildId).Select(y => (Guid?)y.MentorMembershipId).FirstOrDefaultAsync(cancellationToken);
        return mentorId is null
            ? null
            : await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.Id == mentorId && m.Role == Role.Mentor && m.RemovedAt == null, cancellationToken);
    }
}
