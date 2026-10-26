using Microsoft.AspNetCore.Authentication;

namespace PromiseHub.Api.Authentication;

/// <summary>Moves a signed-in session to another membership of the same person, keeping the user and "remember me".</summary>
public static class SessionCookie
{
    public static async Task ReissueAsync(HttpContext http, Guid membershipId)
    {
        if (!Guid.TryParse(http.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId))
        {
            return;
        }
        var current = await http.AuthenticateAsync(AuthSchemes.Session);
        await http.SignInAsync(AuthSchemes.Session, AuthenticationSetup.SessionPrincipal(userId, membershipId),
            current.Properties ?? new AuthenticationProperties());
    }
}
