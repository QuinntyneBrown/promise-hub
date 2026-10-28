using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application;
using PromiseHub.Application.Events;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>A youth's schedule and RSVPs (L2-094, ADR 0064): Roster, RespondToSessions (Youth only), then the guardian consent gate (L2-056).</summary>
public static class ScheduleEndpoints
{
    public static IEndpointRouteBuilder MapScheduleEndpoints(this IEndpointRouteBuilder app)
    {
        var schedule = app.MapGroup("/schedule").RequireModule(ModuleId.Roster).RequirePermission(Permission.RespondToSessions).RequireGuardianConsent();
        schedule.MapGet("", (YouthScheduleHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        schedule.MapPut("/{eventId:guid}/rsvp", async (Guid eventId, RsvpRequest request, RsvpHandler handler, CancellationToken ct) =>
        {
            var (result, rsvp) = await handler.HandleAsync(eventId, request, ct);
            return result.Status switch
            {
                ResultStatus.Done => Results.Ok(rsvp),
                ResultStatus.Conflict => Results.Json(new { code = "rsvp-closed" }, contentType: "application/problem+json", statusCode: StatusCodes.Status409Conflict),
                _ => result.ToHttp(),
            };
        });
        return app;
    }
}
