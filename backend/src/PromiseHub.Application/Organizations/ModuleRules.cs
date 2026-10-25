using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>The dependency rules of L2-004: a module that is on needs every module it depends on.</summary>
public static class ModuleRules
{
    public static IReadOnlyList<ModuleViolation> Check(IReadOnlySet<ModuleId> on)
    {
        var violations = new List<ModuleViolation>();
        if (!on.Contains(ModuleId.Roster))
        {
            var dependents = ModuleCatalog.All.Where(m => on.Contains(m) && ModuleCatalog.Needs(m).Contains(ModuleId.Roster)).ToList();
            if (dependents.Count > 0)
            {
                var names = dependents.Select(ModuleCatalog.Name).ToList();
                var list = names.Count == 1 ? names[0] : $"{string.Join(", ", names[..^1])} and {names[^1]}";
                violations.Add(new ModuleViolation(nameof(ModuleId.Roster), $"{list} {(names.Count == 1 ? "needs" : "need")} the roster."));
            }
        }
        foreach (var module in ModuleCatalog.All.Where(on.Contains))
        {
            var missing = ModuleCatalog.Needs(module).Where(n => n != ModuleId.Roster && !on.Contains(n)).ToList();
            if (missing.Count > 0)
            {
                violations.Add(new ModuleViolation(
                    module.ToString(),
                    $"{ModuleCatalog.Name(module)} needs {string.Join(" and ", missing.Select(ModuleCatalog.Name))}."));
            }
        }
        return violations;
    }
}
