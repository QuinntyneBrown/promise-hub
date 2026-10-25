using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Authentication;

public static class AuthenticationSetup
{
    public static IServiceCollection AddStaffAuthentication(this IServiceCollection services)
    {
        services
            .AddAuthentication(AuthSchemes.Session)
            .AddCookie(AuthSchemes.Session, o =>
            {
                o.Cookie.Name = ".PromiseHub.Session";
                o.Cookie.HttpOnly = true;
                o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                o.Cookie.SameSite = SameSiteMode.Strict;
                o.ExpireTimeSpan = SignInPolicy.IdleTimeout;
                o.SlidingExpiration = true;
                o.Events.OnRedirectToLogin = context =>
                {
                    // A session cookie that no longer authenticates has expired or been revoked (L2-006 criterion 4).
                    var expired = context.Request.Cookies.ContainsKey(o.Cookie.Name);
                    return Problems.Write(context.Response, StatusCodes.Status401Unauthorized, expired ? "session-expired" : "unauthenticated");
                };
                o.Events.OnRedirectToAccessDenied = context =>
                    Problems.Write(context.Response, StatusCodes.Status403Forbidden, "forbidden");
            })
            .AddCookie(AuthSchemes.MfaPending, o =>
            {
                o.Cookie.Name = ".PromiseHub.Mfa";
                o.Cookie.HttpOnly = true;
                o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                o.Cookie.SameSite = SameSiteMode.Strict;
                o.ExpireTimeSpan = TimeSpan.FromMinutes(5);
                o.SlidingExpiration = false;
            });
        return services;
    }

    public static ClaimsPrincipal SessionPrincipal(Guid userId, Guid membershipId) =>
        new(new ClaimsIdentity(
            [new Claim(AuthSchemes.UserClaim, userId.ToString()), new Claim(AuthSchemes.MembershipClaim, membershipId.ToString())],
            AuthSchemes.Session));

    public static ClaimsPrincipal MfaPendingPrincipal(Guid userId) =>
        new(new ClaimsIdentity([new Claim(AuthSchemes.UserClaim, userId.ToString())], AuthSchemes.MfaPending));
}
