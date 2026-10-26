using Microsoft.AspNetCore.Authentication;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Authentication;

/// <summary>Issues and moves the session cookie, always carrying the person's current session version (L2-031).</summary>
public static class SessionCookie
{
    public static async Task SignInAsync(HttpContext http, Guid userId, Guid membershipId, AuthenticationProperties? properties = null)
    {
        var version = await http.RequestServices.GetRequiredService<AccountHandler>().SessionVersionAsync(userId, http.RequestAborted);
        await http.SignInAsync(AuthSchemes.Session, AuthenticationSetup.SessionPrincipal(userId, membershipId, version), properties ?? new AuthenticationProperties());
    }

    /// <summary>Moves a signed-in session to another membership of the same person, keeping "remember me".</summary>
    public static async Task ReissueAsync(HttpContext http, Guid membershipId)
    {
        if (!Guid.TryParse(http.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId))
        {
            return;
        }
        var current = await http.AuthenticateAsync(AuthSchemes.Session);
        await SignInAsync(http, userId, membershipId, current.Properties);
    }
}
