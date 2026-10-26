using Microsoft.AspNetCore.Authentication;
using PromiseHub.Api.Authentication;
using PromiseHub.Application.Staff;

namespace PromiseHub.Api.Endpoints;

/// <summary>Accepting a staff invitation (anonymous, by the emailed link) and the phone onboarding step (signed in).</summary>
public static class InvitationEndpoints
{
    public static IEndpointRouteBuilder MapInvitationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/invitations/{token}", async (string token, InvitationHandler handler, CancellationToken ct) =>
        {
            var (open, invitation) = await handler.GetAsync(token, ct);
            return open ? Results.Ok(invitation) : Results.Json(invitation ?? (object)new { }, statusCode: StatusCodes.Status410Gone);
        }).AllowAnonymous();
        app.MapPost("/invitations/{token}/accept", async (string token, AcceptInvitationCommand command, InvitationHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var result = await handler.AcceptAsync(token, command, ct);
            if (result.Gone)
            {
                return Results.Json(result.Invitation ?? (object)new { }, statusCode: StatusCodes.Status410Gone);
            }
            if (result.Errors is { } errors)
            {
                return Results.Json(new { errors }, statusCode: StatusCodes.Status422UnprocessableEntity);
            }
            await SessionCookie.SignInAsync(http, result.UserId!.Value, result.MembershipId!.Value);
            return Results.Ok(new { status = "signed-in" });
        }).AllowAnonymous();
        app.MapPut("/me/phone", async (PhoneCommand command, InvitationHandler handler, CancellationToken ct) => (await handler.SavePhoneAsync(command, ct)).ToHttp());
        return app;
    }
}
