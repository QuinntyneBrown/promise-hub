using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Identity;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Staff;

namespace PromiseHub.Application.Staff;

/// <summary>
/// The invited person's side (pages: accept-invite, onboard-staff-phone; L2-009): the link shows the invitation or says it
/// has gone; accepting with a name and password creates the account (or uses the existing one with its password) and the
/// membership in the invitation's organization only, then the phone step saves a mobile for alerts.
/// </summary>
public sealed class InvitationHandler(IPromiseHubDb db, TenantContext tenant, IPasswordHasher hasher, IAuditWriter audit, TimeProvider clock)
{
    public async Task<InvitationLookup> GetAsync(string token, CancellationToken cancellationToken = default)
    {
        var invitation = await FindAsync(token, cancellationToken);
        return invitation is null
            ? new InvitationLookup(null, "used")
            : new InvitationLookup(await DtoAsync(invitation, cancellationToken), GoneReason(invitation, clock.GetUtcNow()));
    }

    /// <summary>Why a link no longer works, or null while it is open (L2-052 criterion 3, L2-054 criterion 1).</summary>
    private static string? GoneReason(StaffInvitation invitation, DateTimeOffset now) =>
        invitation.AcceptedAt is not null ? "used"
        : invitation.WithdrawnAt is not null ? "withdrawn"
        : invitation.Expired(now) ? "expired"
        : null;

    public async Task<AcceptInvitationResult> AcceptAsync(string token, AcceptInvitationCommand command, CancellationToken cancellationToken = default)
    {
        var invitation = await FindAsync(token, cancellationToken);
        var now = clock.GetUtcNow();
        if (invitation is null || !invitation.Open(now))
        {
            return new AcceptInvitationResult(true, null, null, null, invitation is null ? null : await DtoAsync(invitation, cancellationToken),
                invitation is null ? "used" : GoneReason(invitation, now));
        }
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors["name"] = "Enter your name.";
        }
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Email == invitation.Email, cancellationToken);
        if (user?.PasswordHash is { } hash)
        {
            if (!hasher.Verify(hash, command.Password ?? string.Empty))
            {
                errors["password"] = "Use the password you already have for PromiseHub.";
            }
        }
        else if (PasswordPolicy.Check(command.Password, invitation.Email) is { } weak)
        {
            errors["password"] = weak;
        }
        if (errors.Count > 0)
        {
            return new AcceptInvitationResult(false, errors, null, null);
        }
        tenant.ResolveForJob(invitation.OrganizationId);
        if (user is null)
        {
            user = new StaffUser(Guid.NewGuid(), invitation.Email, hasher.Hash(command.Password!), null);
            db.StaffUsers.Add(user);
        }
        var membership = new Membership(Guid.NewGuid(), invitation.OrganizationId, command.Name!.Trim(), invitation.Email, invitation.Role);
        if (invitation.ChildId is { } childId)
        {
            // A youth account links to the child record named on the invitation (L2-052, L2-045).
            membership.LinkChild(childId);
        }
        db.Memberships.Add(membership);
        var tracked = await db.StaffInvitations.SingleAsync(i => i.Id == invitation.Id, cancellationToken);
        tracked.Accept(now);
        audit.Record(new AuditEvent(AuditAction.Updated, "StaffInvitation", invitation.Id, $"{membership.PersonName} accepted the invitation as {invitation.Role}"));
        await db.SaveChangesAsync(cancellationToken);
        return new AcceptInvitationResult(false, null, user.Id, membership.Id);
    }

    public async Task<Result> SavePhoneAsync(PhoneCommand command, CancellationToken cancellationToken = default)
    {
        var mobile = command.Mobile?.Trim() ?? string.Empty;
        if (ContactMask.Digits(mobile).Length != 10)
        {
            return Result.Invalid(new Dictionary<string, string> { ["mobile"] = "Include the area code, like 905-555-0101." });
        }
        var membership = await db.Memberships.SingleAsync(m => m.Id == tenant.MembershipId, cancellationToken);
        membership.SetMobile(mobile);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private async Task<StaffInvitation?> FindAsync(string token, CancellationToken cancellationToken)
    {
        var hash = GuardianTokens.Hash(token);
        return await db.StaffInvitations.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(i => i.TokenHash == hash, cancellationToken);
    }

    private async Task<InvitationDto> DtoAsync(StaffInvitation invitation, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == invitation.OrganizationId, cancellationToken);
        var child = invitation.ChildId is { } childId
            ? await db.Children.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId && c.OrganizationId == invitation.OrganizationId, cancellationToken)
            : null;
        return new InvitationDto(invitation.Email, organization.Name, invitation.Role.ToString(), invitation.InvitedBy, child?.FullName);
    }
}
