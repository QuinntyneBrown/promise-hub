using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Authorization;

/// <summary>
/// Answers 403 "consent-required" when the caller is a youth whose linked child needs a guardian's consent and has none in force
/// (L2-056, L2-057, ADR 0046). Evaluated on every request; add it after the module and permission checks.
/// </summary>
public sealed class GuardianConsentFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var services = context.HttpContext.RequestServices;
        var tenant = services.GetRequiredService<ITenantContext>();
        var status = await services.GetRequiredService<ConsentGate>().ForMembershipAsync(tenant.MembershipId, context.HttpContext.RequestAborted);
        return status is { Gated: true }
            ? Results.Json(new { code = "consent-required", consentAge = status.ConsentAge }, contentType: "application/problem+json", statusCode: StatusCodes.Status403Forbidden)
            : await next(context);
    }
}
