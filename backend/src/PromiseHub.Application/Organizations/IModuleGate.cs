using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Organizations;

/// <summary>Which modules are on for the current tenant. Read by endpoint gates and background jobs.</summary>
public interface IModuleGate
{
    Task<IReadOnlySet<ModuleId>> OnAsync(CancellationToken cancellationToken = default);

    Task<bool> IsOnAsync(ModuleId module, CancellationToken cancellationToken = default);
}
