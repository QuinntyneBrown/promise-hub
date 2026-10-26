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
            // A cookie from before "sign out everywhere" carries an older session version (L2-031).
            if (membership is not null && Guid.TryParse(context.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId))
            {
                var claimedVersion = int.TryParse(context.User.FindFirst(AuthSchemes.SessionVersionClaim)?.Value, out var v) ? v : 0;
                var current = await db.StaffUsers.AsNoTracking().Where(u => u.Id == userId).Select(u => (int?)u.SessionVersion).FirstOrDefaultAsync(context.RequestAborted);
                if (current is not null && current != claimedVersion)
                {
                    membership = null;
                }
            }
            // A session signed out on another copy of this cookie stays ended (L2-048).
            if (membership is not null && SessionCookie.SessionId(context) is { } sessionId
                && await db.EndedSessions.AsNoTracking().AnyAsync(s => s.Id == sessionId, context.RequestAborted))
            {
                membership = null;
            }
            if (membership is null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
            tenant.Resolve(membership);
            // A suspended organization is closed to its staff; platform administration stays open (L2-003).
            if (!context.Request.Path.StartsWithSegments("/platform")
                && await db.Organizations.AsNoTracking().AnyAsync(o => o.Id == membership.OrganizationId && o.SuspendedAt != null, context.RequestAborted))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { code = "suspended" }, context.RequestAborted);
                return;
            }
        }
        await next(context);
    }
}
