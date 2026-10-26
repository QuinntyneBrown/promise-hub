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
/// An admin invites staff by email with a role, changes roles and removes access (pages: staff; dialogs: invite-staff,
/// change-role, remove-staff). A changed role applies on the person's next request and a removed membership ends it, since
/// every request reads the membership afresh. Admins cannot change or remove themselves. Every change is audited.
/// </summary>
public sealed class StaffAccessHandler(IPromiseHubDb db, ITenantContext tenant, IEmailSender email, GuardianLinkOptions links, IAuditWriter audit, TimeProvider clock)
{
    public async Task<StaffListDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var members = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null).OrderBy(m => m.PersonName).ToListAsync(cancellationToken);
        var invitations = (await db.StaffInvitations.AsNoTracking().ToListAsync(cancellationToken)).Where(i => i.Open(now)).OrderBy(i => i.Email).ToList();
        return new StaffListDto(
            [.. members.Select(m => new StaffMemberDto(m.Id, m.PersonName, m.Email, m.Role.ToString(), m.Id == tenant.MembershipId))],
            [.. invitations.Select(i => new StaffInvitationDto(i.Id, i.Email, i.Role.ToString(), i.InvitedBy, i.InvitedAt, i.ExpiresAt))]);
    }

    public async Task<Result> InviteAsync(InviteStaffCommand command, CancellationToken cancellationToken = default)
    {
        var address = command.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        if (!address.Contains('@', StringComparison.Ordinal) || !address.Split('@')[^1].Contains('.', StringComparison.Ordinal))
        {
            errors["email"] = "Enter a work email like name@example.org.";
        }
        if (!Enum.TryParse<Role>(command.Role, out var role))
        {
            errors["role"] = "Choose a role.";
        }
        if (errors.Count == 0 && tenant.Role == Role.VolunteerCoordinator && role != Role.YouthWorker)
        {
            errors["role"] = "Coordinators invite youth workers. Ask an admin for other roles.";
        }
        if (errors.Count == 0)
        {
            var member = await db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.Email == address && m.RemovedAt == null, cancellationToken);
            var now = clock.GetUtcNow();
            if (member is not null)
            {
                errors["email"] = $"{member.PersonName} already has access.";
            }
            else if ((await db.StaffInvitations.AsNoTracking().Where(i => i.Email == address).ToListAsync(cancellationToken)).Any(i => i.Open(now)))
            {
                errors["email"] = "An invitation to this email is already waiting.";
            }
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var token = GuardianTokens.New();
        var invitation = new StaffInvitation(Guid.NewGuid(), tenant.OrganizationId, address, role, GuardianTokens.Hash(token), tenant.ActorName, clock.GetUtcNow());
        db.StaffInvitations.Add(invitation);
        audit.Record(new AuditEvent(AuditAction.Created, "StaffInvitation", invitation.Id, $"{address} invited as {role} by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        await email.SendAsync(address, $"Join {organization.Name} on PromiseHub",
            $"{tenant.ActorName} invited you to {organization.Name} on PromiseHub. Accept within 14 days: {links.BaseUrl.TrimEnd('/')}/invite/{token}", cancellationToken);
        return Result.Created(invitation.Id);
    }

    public async Task<Result> WithdrawAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invitation = await db.StaffInvitations.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (invitation is null || !invitation.Open(clock.GetUtcNow()))
        {
            return Result.NotFound;
        }
        invitation.Withdraw(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Deleted, "StaffInvitation", invitation.Id, $"Invitation to {invitation.Email} withdrawn by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ChangeRoleAsync(Guid membershipId, ChangeRoleCommand command, CancellationToken cancellationToken = default)
    {
        var member = await db.Memberships.FirstOrDefaultAsync(m => m.Id == membershipId && m.RemovedAt == null, cancellationToken);
        if (member is null)
        {
            return Result.NotFound;
        }
        if (member.Id == tenant.MembershipId)
        {
            return Result.Invalid(new Dictionary<string, string> { ["role"] = "You can’t change your own role." });
        }
        if (!Enum.TryParse<Role>(command.Role, out var role))
        {
            return Result.Invalid(new Dictionary<string, string> { ["role"] = "Choose a role." });
        }
        var before = member.Role;
        member.ChangeRole(role);
        audit.Record(new AuditEvent(AuditAction.RoleChanged, "Membership", member.Id, $"{member.PersonName} · {before} → {role} by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> RemoveAsync(Guid membershipId, CancellationToken cancellationToken = default)
    {
        var member = await db.Memberships.FirstOrDefaultAsync(m => m.Id == membershipId && m.RemovedAt == null, cancellationToken);
        if (member is null)
        {
            return Result.NotFound;
        }
        if (member.Id == tenant.MembershipId)
        {
            return Result.Invalid(new Dictionary<string, string> { ["member"] = "You can’t remove your own access. Ask another admin." });
        }
        member.Remove(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Deleted, "Membership", member.Id, $"{member.PersonName}’s access removed by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
