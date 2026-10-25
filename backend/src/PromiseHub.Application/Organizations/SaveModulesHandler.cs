using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>Validates and stores the modules that are on. Data of a module turned off is left untouched.</summary>
public sealed class SaveModulesHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, IAuditWriter audit)
{
    public async Task<SaveModulesResult> HandleAsync(IReadOnlySet<ModuleId> on, CancellationToken cancellationToken = default)
    {
        var violations = ModuleRules.Check(on);
        if (violations.Count > 0)
        {
            return new SaveModulesResult(0, violations);
        }

        var configuration = await db.ModuleConfigurations.FirstOrDefaultAsync(cancellationToken);
        if (configuration is null)
        {
            configuration = new ModuleConfiguration(Guid.NewGuid(), tenant.OrganizationId, string.Empty, clock.GetUtcNow());
            db.ModuleConfigurations.Add(configuration);
        }
        var before = configuration.On.Select(m => m.ToString()).ToList();
        configuration.Set(on, clock.GetUtcNow());
        audit.Record(new AuditEvent(
            AuditAction.ModuleChanged,
            "ModuleConfiguration",
            configuration.Id,
            $"{on.Count} of {ModuleCatalog.All.Count} modules on",
            Before: before,
            After: configuration.On.Select(m => m.ToString()).ToList()));
        await db.SaveChangesAsync(cancellationToken);
        return new SaveModulesResult(on.Count, []);
    }
}
