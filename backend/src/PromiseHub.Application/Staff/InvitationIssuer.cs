using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Staff;

namespace PromiseHub.Application.Staff;

/// <summary>
/// Issues and reissues invitations for every role (ADR 0045): a random token whose hash only is stored, an audit entry and
/// the email with the /invite link that lasts 14 days. The caller has validated the request.
/// </summary>
public sealed class InvitationIssuer(IPromiseHubDb db, ITenantContext tenant, IEmailSender email, GuardianLinkOptions links, IAuditWriter audit, TimeProvider clock)
{
    public async Task<StaffInvitation> IssueAsync(string address, Role role, Guid? childId, string summary, CancellationToken cancellationToken)
    {
        var token = GuardianTokens.New();
        var invitation = new StaffInvitation(Guid.NewGuid(), tenant.OrganizationId, address, role, GuardianTokens.Hash(token), tenant.ActorName, clock.GetUtcNow(), childId);
        db.StaffInvitations.Add(invitation);
        audit.Record(new AuditEvent(AuditAction.Created, "StaffInvitation", invitation.Id, summary));
        await db.SaveChangesAsync(cancellationToken);
        await SendAsync(invitation, token, cancellationToken);
        return invitation;
    }

    /// <summary>A fresh link on the same invitation; the previous link stops working.</summary>
    public async Task ReissueAsync(StaffInvitation invitation, CancellationToken cancellationToken)
    {
        var token = GuardianTokens.New();
        invitation.Reissue(GuardianTokens.Hash(token), clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, "StaffInvitation", invitation.Id, $"Invitation to {invitation.Email} resent by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        await SendAsync(invitation, token, cancellationToken);
    }

    private async Task SendAsync(StaffInvitation invitation, string token, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        await email.SendAsync(invitation.Email, $"Join {organization.Name} on PromiseHub",
            $"{tenant.ActorName} invited you to {organization.Name} on PromiseHub. Accept within 14 days: {links.BaseUrl.TrimEnd('/')}/invite/{token}", cancellationToken);
    }
}
