using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Staff;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// The only handler that spans tenants (L2-003): platform admins list, add, suspend and reinstate organizations. Every
/// call checks that the signed-in person is a platform admin; everyone else is refused.
/// </summary>
public sealed class PlatformOrganizationsHandler(IPromiseHubDb db, TenantContext tenant, IEmailSender email, GuardianLinkOptions links, IAuditWriter audit, TimeProvider clock)
{
    private static readonly Dictionary<string, IReadOnlyList<ModuleId>> Presets = new()
    {
        ["Whole suite"] = ModuleCatalog.All,
        ["Just check-in"] = [ModuleId.Roster, ModuleId.RollCall, ModuleId.QuickCards],
        ["Just slips"] = [ModuleId.Roster, ModuleId.Slips],
    };

    public static string Status(Organization organization) =>
        organization.SuspendedAt is not null ? "Suspended" : organization.ProfileConfirmedAt is null ? "SettingUp" : "Active";

    public async Task<PlatformOrganizationListDto?> ListAsync(string? q, string? plan, string? status, CancellationToken cancellationToken = default)
    {
        if (!await IsPlatformAdminAsync(cancellationToken))
        {
            return null;
        }
        var organizations = await db.Organizations.AsNoTracking().OrderBy(o => o.Name).ToListAsync(cancellationToken);
        var children = (await db.Children.IgnoreQueryFilters().AsNoTracking().Where(c => c.DeletedAt == null).Select(c => c.OrganizationId).ToListAsync(cancellationToken))
            .GroupBy(id => id).ToDictionary(g => g.Key, g => g.Count());
        var modules = (await db.ModuleConfigurations.IgnoreQueryFilters().AsNoTracking().ToListAsync(cancellationToken))
            .ToDictionary(m => m.OrganizationId, m => m.On.Count);
        var rows = organizations
            .Select(o => new PlatformOrganizationDto(o.Id, o.Name, o.Plan.ToString(), children.GetValueOrDefault(o.Id), modules.GetValueOrDefault(o.Id), Status(o), o.SuspensionReason))
            .Where(r => string.IsNullOrWhiteSpace(q) || r.Name.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
            .Where(r => string.IsNullOrWhiteSpace(plan) || r.Plan == plan)
            .Where(r => string.IsNullOrWhiteSpace(status) || r.Status == status);
        return new PlatformOrganizationListDto([.. rows]);
    }

    public async Task<Result> AddAsync(AddOrganizationCommand command, CancellationToken cancellationToken = default)
    {
        if (!await IsPlatformAdminAsync(cancellationToken))
        {
            return Result.Forbidden;
        }
        var name = command.Name?.Trim() ?? string.Empty;
        var address = command.AdminEmail?.Trim().ToLowerInvariant() ?? string.Empty;
        var errors = new Dictionary<string, string>();
        if (name.Length == 0)
        {
            errors["name"] = "Enter the organization’s name.";
        }
        else if (await db.Organizations.AnyAsync(o => o.Name == name, cancellationToken))
        {
            errors["name"] = "An organization with this name already exists.";
        }
        if (address.Length == 0)
        {
            errors["adminEmail"] = "Enter the first admin’s email.";
        }
        else if (!address.Contains('@', StringComparison.Ordinal) || !address.Split('@')[^1].Contains('.', StringComparison.Ordinal))
        {
            errors["adminEmail"] = "That doesn’t look like an email address.";
        }
        if (!Enum.TryParse<Plan>(command.Plan, out var plan))
        {
            errors["plan"] = "Choose a plan.";
        }
        if (!Presets.TryGetValue(command.Preset ?? string.Empty, out var preset))
        {
            errors["preset"] = "Choose the modules.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var now = clock.GetUtcNow();
        var actor = tenant.ActorName;
        var organization = new Organization(Guid.NewGuid(), name, string.Empty, plan);
        db.Organizations.Add(organization);
        audit.Record(new AuditEvent(AuditAction.Created, "Organization", organization.Id, $"{name} added on {plan} by {actor}"));
        await db.SaveChangesAsync(cancellationToken);
        // The new organization's own records are written in its scope, as a job acting for it.
        tenant.ResolveForJob(organization.Id);
        var token = GuardianTokens.New();
        db.ModuleConfigurations.Add(new ModuleConfiguration(Guid.NewGuid(), organization.Id, ModuleConfiguration.Format(preset!), now));
        db.StaffInvitations.Add(new StaffInvitation(Guid.NewGuid(), organization.Id, address, Role.Admin, GuardianTokens.Hash(token), actor, now));
        await db.SaveChangesAsync(cancellationToken);
        await email.SendAsync(address, $"Welcome to PromiseHub, {name}",
            $"{actor} set up {name} on PromiseHub with you as its first admin. Accept within 14 days to finish setup: {links.BaseUrl.TrimEnd('/')}/invite/{token}", cancellationToken);
        return Result.Created(organization.Id);
    }

    public async Task<Result> SuspendAsync(Guid id, SuspendOrganizationCommand command, CancellationToken cancellationToken = default)
    {
        if (!await IsPlatformAdminAsync(cancellationToken))
        {
            return Result.Forbidden;
        }
        var reason = command.Reason?.Trim() ?? string.Empty;
        if (reason.Length == 0)
        {
            return Result.Invalid(new Dictionary<string, string> { ["reason"] = "Give a reason; the organization’s admins will see it." });
        }
        var organization = await db.Organizations.FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        if (organization is null)
        {
            return Result.NotFound;
        }
        organization.Suspend(reason, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, "Organization", id, $"{organization.Name} suspended by {tenant.ActorName}: {reason}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ReinstateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!await IsPlatformAdminAsync(cancellationToken))
        {
            return Result.Forbidden;
        }
        var organization = await db.Organizations.FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        if (organization is null)
        {
            return Result.NotFound;
        }
        organization.Reinstate();
        audit.Record(new AuditEvent(AuditAction.Restored, "Organization", id, $"{organization.Name} reinstated by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private async Task<bool> IsPlatformAdminAsync(CancellationToken cancellationToken)
    {
        var address = await db.Memberships.IgnoreQueryFilters().AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.Email).FirstOrDefaultAsync(cancellationToken);
        return address is not null && await db.StaffUsers.AnyAsync(u => u.Email == address && u.IsPlatformAdmin, cancellationToken);
    }
}
