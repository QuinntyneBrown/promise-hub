using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// The organization setup wizard (L2-008). Each step is done when its data exists, so leaving with "Finish later" keeps
/// progress without a separate record: the organization confirmed, modules chosen, a program, children, a second staff
/// member or an invitation, and a slip sent (only while Permission slips is on).
/// </summary>
public sealed class SetupHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, IAuditWriter audit, TimeProvider clock)
{
    public async Task<SetupDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var steps = new List<SetupStepDto>
        {
            new("organization", organization.ProfileConfirmedAt is not null),
            new("modules", await db.ModuleConfigurations.AnyAsync(cancellationToken)),
            new("program", await db.Programs.AnyAsync(cancellationToken)),
            new("children", await db.Children.AnyAsync(cancellationToken)),
            new("staff", await db.Memberships.CountAsync(m => m.RemovedAt == null, cancellationToken) > 1 || await db.StaffInvitations.AnyAsync(cancellationToken)),
        };
        // The first-slip step only exists while Permission slips is on (L2-005).
        if (await modules.IsOnAsync(Domain.Organizations.ModuleId.Slips, cancellationToken))
        {
            steps.Add(new("slip", await db.PermissionSlips.AnyAsync(s => s.Status == SlipStatus.Sent, cancellationToken)));
        }
        var next = steps.FirstOrDefault(s => !s.Done)?.Key;
        return new SetupDto(steps, next, next is null);
    }

    public async Task<Result> SaveOrganizationAsync(SaveOrganizationCommand command, CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors["name"] = "Enter your organization’s name.";
        }
        if (string.IsNullOrWhiteSpace(command.City))
        {
            errors["city"] = "Enter the city you work in.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        organization.ChangeProfile(command.Name!.Trim(), command.City!.Trim(), clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Updated, "Organization", organization.Id, $"{organization.Name} · {organization.City}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
