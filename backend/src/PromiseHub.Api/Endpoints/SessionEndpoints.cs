using PromiseHub.Application;
using PromiseHub.Api.Authorization;
using PromiseHub.Application.Identity;
using PromiseHub.Api.Authentication;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SessionEndpoints
{
    public static IEndpointRouteBuilder MapSessionEndpoints(this IEndpointRouteBuilder root)
    {
        // The session belongs to every member, participant roles included (ADR 0043).
        var app = root.MapGroup(string.Empty).AllowAnyMember();
        app.MapGet("/me", (GetSessionHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        app.MapGet("/me/account", (AccountHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        app.MapPut("/me/profile", async (SaveProfileRequest request, ProfileHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(request, ct)).ToHttp());
        app.MapPost("/me/recovery-codes", async (AccountHandler handler, HttpContext http, CancellationToken ct) =>
            Guid.TryParse(http.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId) && await handler.NewRecoveryCodesAsync(userId, ct) is { } codes
                ? Results.Ok(codes)
                : Results.NotFound());
        app.MapPost("/me/sign-out-others", async (AccountHandler handler, HttpContext http, CancellationToken ct) =>
        {
            if (!Guid.TryParse(http.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId) || await handler.SignOutOthersAsync(userId, ct) is null)
            {
                return Results.NotFound();
            }
            await SessionCookie.ReissueAsync(http, Guid.Parse(http.User.FindFirst(AuthSchemes.MembershipClaim)!.Value));
            return Results.NoContent();
        });
        app.MapPost("/me/password", async (ChangePasswordRequest request, ChangePasswordHandler handler, HttpContext http, CancellationToken ct) =>
        {
            if (!Guid.TryParse(http.User.FindFirst(AuthSchemes.UserClaim)?.Value, out var userId))
            {
                return Results.NotFound();
            }
            var result = await handler.ChangeAsync(userId, request, ct);
            if (result.Status == ResultStatus.Done)
            {
                // This device carries on with the new session version; every other session ends (L2-118).
                await SessionCookie.ReissueAsync(http, Guid.Parse(http.User.FindFirst(AuthSchemes.MembershipClaim)!.Value));
            }
            return result.ToHttp();
        });
        app.MapGet("/me/organizations", (SwitchOrganizationHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        app.MapPost("/me/organization", async (SwitchOrganizationCommand command, SwitchOrganizationHandler handler, HttpContext http, CancellationToken ct) =>
        {
            if (await handler.SwitchAsync(command, ct) is not { } membershipId)
            {
                return Results.NotFound();
            }
            await SessionCookie.ReissueAsync(http, membershipId);
            return Results.NoContent();
        });
        return root;
    }
}
