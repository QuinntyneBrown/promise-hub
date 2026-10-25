using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Modules;

/// <summary>Answers 404 with no body when the endpoint's module is off for the tenant (L2-005 criterion 1).</summary>
public sealed class ModuleGateFilter(ModuleId module) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var gate = context.HttpContext.RequestServices.GetRequiredService<IModuleGate>();
        return await gate.IsOnAsync(module, context.HttpContext.RequestAborted) ? await next(context) : Results.NotFound();
    }
}
