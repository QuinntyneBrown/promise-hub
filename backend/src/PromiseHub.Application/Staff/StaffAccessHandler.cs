using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
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
public sealed class StaffAccessHandler(IPromiseHubDb db, ITenantContext tenant, InvitationIssuer issuer, IModuleGate modules, IAuditWriter audit, TimeProvider clock)
{
    public async Task<StaffListDto> ListAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var members = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null).OrderBy(m => m.PersonName).ToListAsync(cancellationToken);
        // Waiting and expired invitations; accepted and withdrawn ones leave the list (L2-052 criterion 4).
        var invitations = await db.StaffInvitations.AsNoTracking().Where(i => i.AcceptedAt == null && i.WithdrawnAt == null).OrderBy(i => i.Email).ToListAsync(cancellationToken);
        var childIds = invitations.Where(i => i.ChildId != null).Select(i => i.ChildId!.Value).ToList();
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.FullName, cancellationToken);
        return new StaffListDto(
            [.. members.Select(m => new StaffMemberDto(m.Id, m.PersonName, m.Email, m.Role.ToString(), m.Id == tenant.MembershipId))],
            [.. invitations.Select(i => new StaffInvitationDto(i.Id, i.Email, i.Role.ToString(), i.InvitedBy, i.InvitedAt, i.ExpiresAt,
                i.Open(now) ? "Pending" : "Expired", i.ChildId is { } c ? children.GetValueOrDefault(c) : null, i.ReplacementRequestedAt is not null))]);
    }

    /// <summary>A fresh link on a waiting or expired invitation (L2-052 criterion 5); accepted or withdrawn ones are not found.</summary>
    public async Task<Result> ResendAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invitation = await db.StaffInvitations.FirstOrDefaultAsync(i => i.Id == id && i.AcceptedAt == null && i.WithdrawnAt == null, cancellationToken);
        if (invitation is null)
        {
            return Result.NotFound;
        }
        await issuer.ReissueAsync(invitation, cancellationToken);
        return Result.Done;
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
        else if (errors.Count == 0 && role == Role.Youth)
        {
            // Every youth account links to a child, so youth are invited from their child record (ADR 0045).
            errors["role"] = "Invite youth from their child record.";
        }
        else if (errors.Count == 0 && role == Role.Mentor && !await modules.IsOnAsync(ModuleId.Mentoring, cancellationToken))
        {
            errors["role"] = "Turn on Mentoring to invite mentors.";
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
        var invitation = await issuer.IssueAsync(address, role, null, $"{address} invited as {role} by {tenant.ActorName}", cancellationToken);
        return Result.Created(invitation.Id);
    }

    public async Task<Result> WithdrawAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invitation = await db.StaffInvitations.FirstOrDefaultAsync(i => i.Id == id && i.AcceptedAt == null && i.WithdrawnAt == null, cancellationToken);
        if (invitation is null)
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
