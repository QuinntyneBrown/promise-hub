using PromiseHub.Application.Attendance;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;

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
        g.MapGet("/consent/{token}", async (string token, GuardianConsentHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), ct)));
        g.MapPost("/consent/{token}/sign", async (string token, GiveConsentRequest body, GuardianConsentHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.SignAsync(Request(token, http), body, ct)));
        g.MapPost("/consent/{token}/withdraw", async (string token, WithdrawConsentRequest body, GuardianConsentHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.WithdrawAsync(Request(token, http), body, ct)));
        g.MapGet("/survey/{token}", async (string token, PromiseHub.Application.Surveys.GuardianSurveyHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), ct)));
        g.MapPost("/survey/{token}", async (string token, PromiseHub.Application.Surveys.SurveyAnswerRequest body, PromiseHub.Application.Surveys.GuardianSurveyHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.AnswerAsync(Request(token, http), body, ct)));
        g.MapPost("/home/{token}/data-requests", async (string token, DataRequestBody body, DataRequestHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.AskAsync(Request(token, http), body, ct)));
        g.MapGet("/home/{token}", async (string token, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), ct)));
        g.MapGet("/home/{token}/children/{childId:guid}", async (string token, Guid childId, GuardianChildHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), childId, ct)));
        g.MapGet("/home/{token}/announcements", async (string token, GuardianAnnouncementsHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(Request(token, http), ct)));
        g.MapPost("/home/{token}/announcements/read", async (string token, GuardianAnnouncementsHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.MarkReadAsync(Request(token, http), ct)));
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
        g.MapPost("/home/{token}/pickup-requests/{requestId:guid}", async (string token, Guid requestId, DecidePickupRequest body, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.DecidePickupAsync(Request(token, http), requestId, body, ct)));
        g.MapPut("/home/{token}/household", async (string token, UpdateHouseholdRequest body, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.UpdateHouseholdAsync(Request(token, http), body, ct)));
        g.MapPut("/home/{token}/children/{childId:guid}/medical", async (string token, Guid childId, UpdateMedicalRequest body, GuardianHomeHandler handler, HttpContext http, CancellationToken ct) =>
            ToHttp(await handler.UpdateMedicalAsync(Request(token, http), childId, body, ct)));
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

    internal static GuardianRequest Request(string token, HttpContext http) =>
        new(token, http.Request.Cookies[DeviceCookie], http.Request.Headers.UserAgent.ToString());

    internal static IResult ToHttp(GuardianResult result) => result.Outcome switch
    {
        GuardianOutcome.Ok => Results.Ok(result.Value),
        GuardianOutcome.Done => Results.NoContent(),
        GuardianOutcome.Created => Results.Json(result.Value, statusCode: StatusCodes.Status201Created),
        GuardianOutcome.Gone => Results.Json(result.Value, contentType: "application/problem+json", statusCode: StatusCodes.Status410Gone),
        GuardianOutcome.VerificationRequired => Results.Json(result.Value, contentType: "application/problem+json", statusCode: StatusCodes.Status401Unauthorized),
        GuardianOutcome.Locked => Results.Json(new { code = "locked" }, contentType: "application/problem+json", statusCode: StatusCodes.Status423Locked),
        GuardianOutcome.NotFound => Results.NotFound(),
        GuardianOutcome.Unavailable => Results.Json(new { code = "unavailable" }, contentType: "application/problem+json", statusCode: StatusCodes.Status503ServiceUnavailable),
        GuardianOutcome.Forbidden => Results.Json(new { code = "forbidden" }, contentType: "application/problem+json", statusCode: StatusCodes.Status403Forbidden),
        GuardianOutcome.TooMany => Results.Json(new { code = "too-many" }, contentType: "application/problem+json", statusCode: StatusCodes.Status429TooManyRequests),
        GuardianOutcome.Conflict => Results.Json(result.Value ?? new { code = "conflict" }, contentType: "application/problem+json", statusCode: StatusCodes.Status409Conflict),
        _ => Results.Json(new { errors = result.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
    };
}
