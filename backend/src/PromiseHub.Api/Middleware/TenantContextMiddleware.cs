using Microsoft.EntityFrameworkCore;
using PromiseHub.Api.Authentication;
using PromiseHub.Application;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Middleware;

/// <summary>Resolves the tenant from the signed-in session's membership. Never reads an organization id from the request.</summary>
public sealed class TenantContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, TenantContext tenant, IPromiseHubDb db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claimed = Guid.TryParse(context.User.FindFirst(AuthSchemes.MembershipClaim)?.Value, out var membershipId)
                ? await db.Memberships.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(m => m.Id == membershipId, context.RequestAborted)
                : null;
            var membership = claimed?.RemovedAt is null ? claimed : null;
            if (claimed is { RemovedAt: not null })
            {
                // Removed from the active organization: continue in the person's remaining one, or sign out (L2-002 criterion 4).
                membership = await ActiveMembership.ForAsync(db, claimed.Email, context.RequestAborted);
                if (membership is not null)
                {
                    await SessionCookie.ReissueAsync(context, membership.Id);
                }
            }
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
