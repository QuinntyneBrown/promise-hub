using PromiseHub.Api.Authorization;
using PromiseHub.Application.Billing;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Endpoints;

/// <summary>Billing: plan, limits and usage, for admins. Not a module; every organization has a plan.</summary>
public static class BillingEndpoints
{
    public static IEndpointRouteBuilder MapBillingEndpoints(this IEndpointRouteBuilder app)
    {
        var billing = app.MapGroup("/billing").RequirePermission(Permission.ManageBilling);
        billing.MapGet(string.Empty, (BillingHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        billing.MapPut("/plan", async (ChangePlanCommand command, BillingHandler handler, CancellationToken ct) =>
        {
            var (result, changed) = await handler.ChangeAsync(command, ct);
            return changed is not null ? Results.Ok(changed) : result.ToHttp();
        });
        return app;
    }
}
