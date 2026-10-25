using PromiseHub.Application.Attendance;
using PromiseHub.Application.Guardian;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Guardian pages: anonymous, reached by a link and a six-digit code, never a password (L2-026). The device cookie is
/// HttpOnly; the page never reads it.
/// </summary>
public static class GuardianEndpoints
{
    public const string DeviceCookie = "ph_guardian_device";

    public static IEndpointRouteBuilder MapGuardianEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/g").AllowAnonymous();
        g.MapPost("/auth/code", async (GuardianCodeRequest request, RequestGuardianCodeHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            return result.Outcome == GuardianOutcome.Done ? Results.Accepted() : ToHttp(result);
        });
        g.MapPost("/auth/verify", async (GuardianVerifyRequest request, VerifyGuardianCodeHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            if (result.Outcome == GuardianOutcome.Done && result.Value is string device)
            {
                http.Response.Cookies.Append(DeviceCookie, device, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = http.Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Path = "/",
                    MaxAge = VerifyGuardianCodeHandler.DeviceLifetime,
                });
                return Results.NoContent();
            }
            return ToHttp(result);
        });
        g.MapGet("/slips/{token}", async (string token, GuardianSlipHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), ct)));
        g.MapPost("/slips/{token}/sign", async (string token, SignSlipRequest body, GuardianSlipHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.SignAsync(Request(token, http), body, ct)));
        g.MapPost("/slips/{token}/decline", async (string token, DeclineSlipRequest body, GuardianSlipHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.DeclineAsync(Request(token, http), body, ct)));
        g.MapGet("/home/{token}", async (string token, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), ct)));
        g.MapPost("/home/{token}/no-show", async (string token, AnswerNoShowRequest body, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.AnswerNoShowAsync(Request(token, http), body, ct)));
        g.MapPost("/home/{token}/children/{childId:guid}/pickups", async (string token, Guid childId, AddPickupCommand body, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var (problem, done) = await handler.AddPickupAsync(Request(token, http), childId, body, ct);
            return problem is not null ? ToHttp(problem) : done!.ToHttp($"/g/home/{token}");
        });
        g.MapDelete("/home/{token}/children/{childId:guid}/pickups/{pickupId:guid}", async (string token, Guid childId, Guid pickupId, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var (problem, done) = await handler.RemovePickupAsync(Request(token, http), childId, pickupId, ct);
            return problem is not null ? ToHttp(problem) : done!.ToHttp();
        });
        var enroll = g.MapGroup("/enroll/{slug}");
        enroll.MapGet("", async (string slug, PromiseHub.Application.Enrollment.GuardianEnrollmentHandler handler, CancellationToken ct) =>
            ToHttp(await handler.PageAsync(slug, ct)));
        enroll.MapPost("/code", async (string slug, PromiseHub.Application.Enrollment.EnrollmentCodeRequest request, PromiseHub.Application.Enrollment.GuardianEnrollmentHandler handler, CancellationToken ct) =>
        {
            var result = await handler.RequestCodeAsync(slug, request, ct);
            return result.Outcome == GuardianOutcome.Done ? Results.Accepted() : ToHttp(result);
        });
        enroll.MapPost("/verify", async (string slug, PromiseHub.Application.Enrollment.EnrollmentVerifyRequest request, PromiseHub.Application.Enrollment.GuardianEnrollmentHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var result = await handler.VerifyAsync(slug, request, ct);
            if (result.Outcome == GuardianOutcome.Done && result.Value is string token)
            {
                http.Response.Cookies.Append(EnrollCookie, token, new CookieOptions { HttpOnly = true, Secure = http.Request.IsHttps, SameSite = SameSiteMode.Lax, Path = "/", MaxAge = TimeSpan.FromDays(7) });
                return Results.NoContent();
            }
            return ToHttp(result);
        });
        enroll.MapGet("/draft", async (string slug, PromiseHub.Application.Enrollment.GuardianEnrollmentHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.DraftAsync(slug, http.Request.Cookies[EnrollCookie], ct)));
        enroll.MapPut("/draft", async (string slug, PromiseHub.Application.Enrollment.EnrollmentDraft draft, PromiseHub.Application.Enrollment.GuardianEnrollmentHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.SaveAsync(slug, http.Request.Cookies[EnrollCookie], draft, ct)));
        enroll.MapPost("/submit", async (string slug, PromiseHub.Application.Enrollment.EnrollmentSubmitRequest request, PromiseHub.Application.Enrollment.GuardianEnrollmentHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.SubmitAsync(slug, http.Request.Cookies[EnrollCookie], request, ct)));
        return app;
    }

    public const string EnrollCookie = "ph_enroll_device";

    private static GuardianRequest Request(string token, HttpContext http) =>
        new(token, http.Request.Cookies[DeviceCookie], http.Request.Headers.UserAgent.ToString());

    private static IResult ToHttp(GuardianResult result) => result.Outcome switch
    {
        GuardianOutcome.Ok => Results.Ok(result.Value),
        GuardianOutcome.Done => Results.NoContent(),
        GuardianOutcome.Gone => Results.Json(result.Value, contentType: "application/problem+json", statusCode: StatusCodes.Status410Gone),
        GuardianOutcome.VerificationRequired => Results.Json(result.Value, contentType: "application/problem+json", statusCode: StatusCodes.Status401Unauthorized),
        GuardianOutcome.Locked => Results.Json(new { code = "locked" }, contentType: "application/problem+json", statusCode: StatusCodes.Status423Locked),
        GuardianOutcome.NotFound => Results.NotFound(),
        GuardianOutcome.Conflict => Results.Json(new { code = "conflict" }, contentType: "application/problem+json", statusCode: StatusCodes.Status409Conflict),
        _ => Results.Json(new { errors = result.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
    };
}
