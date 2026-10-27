using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Authorization;

/// <summary>
/// Answers 403 "no-cohort" when the caller is a youth not placed in a program (L2-060, ADR 0047). Evaluated on every request; add it
/// after the consent filter, so the consent gate answers first.
/// </summary>
public sealed class PlacementFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var services = context.HttpContext.RequestServices;
        var tenant = services.GetRequiredService<ITenantContext>();
        if (tenant.Role == Role.Youth && !await services.GetRequiredService<Placement>().IsPlacedAsync(tenant.MembershipId, context.HttpContext.RequestAborted))
        {
            return Results.Json(new { code = "no-cohort" }, contentType: "application/problem+json", statusCode: StatusCodes.Status403Forbidden);
        }
        return await next(context);
    }
}
