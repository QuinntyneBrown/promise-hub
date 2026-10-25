using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

public sealed class GetModulesHandler(IModuleGate gate)
{
    public async Task<ModulesDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var on = await gate.OnAsync(cancellationToken);
        return new ModulesDto([.. ModuleCatalog.All.Select(m => new ModuleDto(
            m.ToString(),
            ModuleCatalog.Name(m),
            on.Contains(m),
            [.. ModuleCatalog.Needs(m).Select(n => n.ToString())]))]);
    }
}
