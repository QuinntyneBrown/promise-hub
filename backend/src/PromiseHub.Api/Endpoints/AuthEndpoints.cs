using Microsoft.AspNetCore.Authentication;
using PromiseHub.Api.Authentication;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/auth");

        auth.MapPost("/sign-in", async (SignInRequest request, SignInHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new SignInCommand(request.Email, request.Password), ct);
            return result.Status switch
            {
                SignInStatus.SignedIn => await StartSession(http, result, request.Remember),
                SignInStatus.MfaRequired => await StartMfa(http, result),
                SignInStatus.Locked => Results.Json(new { code = "locked", lockedUntil = result.LockedUntil }, statusCode: StatusCodes.Status423Locked),
                _ => Results.Json(new { code = "invalid-credentials" }, statusCode: StatusCodes.Status401Unauthorized),
            };
        }).AllowAnonymous();

        auth.MapPost("/mfa", async (MfaRequest request, CompleteMfaHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var pending = await http.AuthenticateAsync(AuthSchemes.MfaPending);
            if (!Guid.TryParse(pending.Principal?.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId))
            {
                return Results.Json(new { code = "mfa-expired" }, statusCode: StatusCodes.Status401Unauthorized);
            }
            var result = await handler.HandleAsync(userId, request.Code, ct);
            if (result.Status != SignInStatus.SignedIn)
            {
                return Results.Json(new { code = "invalid-code" }, statusCode: StatusCodes.Status401Unauthorized);
            }
            await http.SignOutAsync(AuthSchemes.MfaPending);
            return await StartSession(http, result, persistent: request.TrustDevice);
        }).AllowAnonymous();

        auth.MapPost("/sign-out", async (HttpContext http) =>
        {
            await http.SignOutAsync(AuthSchemes.Session);
            return Results.NoContent();
        });

        return app;
    }

    private static async Task<IResult> StartSession(HttpContext http, SignInResult result, bool persistent)
    {
        await SessionCookie.SignInAsync(http, result.UserId!.Value, result.MembershipId!.Value, new AuthenticationProperties { IsPersistent = persistent });
        return Results.Ok(new { status = "signed-in" });
    }

    private static async Task<IResult> StartMfa(HttpContext http, SignInResult result)
    {
        await http.SignInAsync(AuthSchemes.MfaPending, AuthenticationSetup.MfaPendingPrincipal(result.UserId!.Value));
        return Results.Ok(new { status = "mfa-required" });
    }
}
