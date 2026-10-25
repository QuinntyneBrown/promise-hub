using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Modules;

public static class ModuleEndpointExtensions
{
    /// <summary>Serves these endpoints only while the module is on for the caller's organization.</summary>
    public static TBuilder RequireModule<TBuilder>(this TBuilder builder, ModuleId module)
        where TBuilder : IEndpointConventionBuilder =>
        builder.AddEndpointFilter(new ModuleGateFilter(module));
}
