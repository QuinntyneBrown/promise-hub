using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.LearningBond;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>
/// Validates and stores the modules that are on. Data of a module turned off is left untouched. Learning Bond also needs the current
/// data-handling agreement accepted before it is turned on; once on, a new agreement version does not turn it off (L2-135, L2-136).
/// </summary>
public sealed class SaveModulesHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, IAuditWriter audit, LearningBondAgreementGate agreement)
{
    public async Task<SaveModulesResult> HandleAsync(IReadOnlySet<ModuleId> on, CancellationToken cancellationToken = default)
    {
        var violations = ModuleRules.Check(on);
        if (violations.Count > 0)
        {
            return new SaveModulesResult(0, violations);
        }

        var configuration = await db.ModuleConfigurations.FirstOrDefaultAsync(cancellationToken);
        var wasOn = configuration?.On.Contains(ModuleId.LearningBond) ?? false;
        if (on.Contains(ModuleId.LearningBond) && !wasOn && !await agreement.IsAcceptedAsync(cancellationToken))
        {
            return new SaveModulesResult(0, [new ModuleViolation(nameof(ModuleId.LearningBond), "Accept the Learning Bond data-handling agreement first.")]);
        }
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
            $"{on.Count} of {ModuleCatalog.All.Count} modules on{LearningBondChange(wasOn, on.Contains(ModuleId.LearningBond))}",
            Before: before,
            After: configuration.On.Select(m => m.ToString()).ToList()));
        await db.SaveChangesAsync(cancellationToken);
        return new SaveModulesResult(on.Count, []);
    }

    // Learning Bond changes are named so the audit search finds them (L2-161 criterion 4).
    private static string LearningBondChange(bool wasOn, bool isOn) => (wasOn, isOn) switch
    {
        (false, true) => " · Learning Bond turned on",
        (true, false) => " · Learning Bond turned off",
        _ => string.Empty,
    };
}
