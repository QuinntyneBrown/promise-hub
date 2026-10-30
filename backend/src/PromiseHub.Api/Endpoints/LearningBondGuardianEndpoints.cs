using PromiseHub.Application.Guardian;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Learning Bond guardian endpoints (L2-162 criterion 6, ADR 0076): anonymous by explicit opt-in, the organization from the link, then the
/// module gate. An unknown link, a suspended organization and the module off all answer 404 with no body.
/// </summary>
public static class LearningBondGuardianEndpoints
{
    public static IEndpointRouteBuilder MapLearningBondGuardianEndpoints(this IEndpointRouteBuilder app)
    {
        var guardian = app.MapGroup("/g/learning-bond/{token}").AllowAnonymous();
        guardian.MapGet(string.Empty, async (string token, LearningBondGuardianHandler handler, HttpContext http, CancellationToken ct) =>
            await handler.GetAsync(new GuardianRequest(token, http.Request.Cookies[GuardianEndpoints.DeviceCookie], http.Request.Headers.UserAgent.ToString()), ct)
                is { } link ? Results.Ok(link) : Results.NotFound());
        return app;
    }
}
