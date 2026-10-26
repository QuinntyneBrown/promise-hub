using Microsoft.AspNetCore.Authentication;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Authentication;

/// <summary>Issues and moves the session cookie, always carrying the person's current session version (L2-031).</summary>
public static class SessionCookie
{
    /// <summary>Starts a session; a new sign-in gets a new session id, a reissue keeps the one it has.</summary>
    public static async Task SignInAsync(HttpContext http, Guid userId, Guid membershipId, AuthenticationProperties? properties = null, Guid? sessionId = null)
    {
        var version = await http.RequestServices.GetRequiredService<AccountHandler>().SessionVersionAsync(userId, http.RequestAborted);
        var principal = AuthenticationSetup.SessionPrincipal(userId, membershipId, version, sessionId ?? Guid.NewGuid());
        await http.SignInAsync(AuthSchemes.Session, principal, properties ?? new AuthenticationProperties());
    }

    /// <summary>The session id the signed-in cookie carries; null for a cookie issued before session ids existed.</summary>
    public static Guid? SessionId(HttpContext http) =>
        Guid.TryParse(http.User.FindFirst(AuthSchemes.SessionIdClaim)?.Value, out var id) ? id : null;

    /// <summary>Moves a signed-in session to another membership of the same person, keeping "remember me".</summary>
    public static async Task ReissueAsync(HttpContext http, Guid membershipId)
    {
        if (!Guid.TryParse(http.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId))
        {
            return;
        }
        var current = await http.AuthenticateAsync(AuthSchemes.Session);
        await SignInAsync(http, userId, membershipId, current.Properties, SessionId(http));
    }
}
