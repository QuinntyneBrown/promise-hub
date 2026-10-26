using Microsoft.EntityFrameworkCore;
using PromiseHub.Api.Authentication;
using PromiseHub.Application;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Middleware;

/// <summary>Resolves the tenant from the signed-in session's membership. Never reads an organization id from the request.</summary>
public sealed class TenantContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, TenantContext tenant, IPromiseHubDb db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var membership = Guid.TryParse(context.User.FindFirst(AuthSchemes.MembershipClaim)?.Value, out var membershipId)
                ? await db.Memberships.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(m => m.Id == membershipId && m.RemovedAt == null, context.RequestAborted)
                : null;
            if (membership is null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
            tenant.Resolve(membership);
        }
        await next(context);
    }
}
