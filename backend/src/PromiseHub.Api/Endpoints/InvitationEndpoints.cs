using Microsoft.AspNetCore.Authentication;
using PromiseHub.Api.Authentication;
using PromiseHub.Application.Staff;

namespace PromiseHub.Api.Endpoints;

/// <summary>Accepting an invitation for any role (anonymous, by the emailed link) and the phone onboarding step (signed in).</summary>
public static class InvitationEndpoints
{
    public static IEndpointRouteBuilder MapInvitationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/invitations/{token}", async (string token, InvitationHandler handler, CancellationToken ct) =>
        {
            var lookup = await handler.GetAsync(token, ct);
            return lookup.Open ? Results.Ok(lookup.Invitation) : Gone(lookup.GoneReason!, lookup.Invitation);
        }).AllowAnonymous();
        app.MapPost("/invitations/{token}/accept", async (string token, AcceptInvitationCommand command, InvitationHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var result = await handler.AcceptAsync(token, command, ct);
            if (result.Gone)
            {
                return Gone(result.GoneReason ?? "used", result.Invitation);
            }
            if (result.Errors is { } errors)
            {
                return Results.Json(new { errors }, statusCode: StatusCodes.Status422UnprocessableEntity);
            }
            await SessionCookie.SignInAsync(http, result.UserId!.Value, result.MembershipId!.Value);
            return Results.Ok(new { status = "signed-in" });
        }).AllowAnonymous();
        app.MapPost("/invitations/{token}/request-new", async (string token, InvitationHandler handler, CancellationToken ct) =>
            await handler.RequestNewAsync(token, ct) ? Results.Accepted() : Results.NotFound()).AllowAnonymous();
        app.MapPut("/me/phone", async (PhoneCommand command, InvitationHandler handler, CancellationToken ct) => (await handler.SavePhoneAsync(command, ct)).ToHttp());
        return app;
    }

    /// <summary>410 with why the link no longer works and, when the invitation is known, who to ask (L2-052, L2-054).</summary>
    private static IResult Gone(string reason, InvitationDto? invitation) =>
        Results.Json(new { reason, invitedBy = invitation?.InvitedBy, organization = invitation?.Organization }, statusCode: StatusCodes.Status410Gone);
}
