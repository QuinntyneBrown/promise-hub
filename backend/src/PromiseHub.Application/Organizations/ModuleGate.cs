using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>Reads the tenant's configuration once per request. An organization without one has nothing on.</summary>
public sealed class ModuleGate(IPromiseHubDb db) : IModuleGate
{
    private IReadOnlySet<ModuleId>? _on;

    public async Task<IReadOnlySet<ModuleId>> OnAsync(CancellationToken cancellationToken = default)
    {
        if (_on is null)
        {
            var configuration = await db.ModuleConfigurations.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            _on = configuration?.On ?? new HashSet<ModuleId>();
        }
        return _on;
    }

    public async Task<bool> IsOnAsync(ModuleId module, CancellationToken cancellationToken = default) =>
        (await OnAsync(cancellationToken)).Contains(module);
}
