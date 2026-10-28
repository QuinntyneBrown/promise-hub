using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Events;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Events: Roster data, read by Roll Call and Slips (ADR 0008).</summary>
public static class EventEndpoints
{
    public static IEndpointRouteBuilder MapEventEndpoints(this IEndpointRouteBuilder app)
    {
        var events = app.MapGroup("/events").RequireModule(ModuleId.Roster);
        events.MapGet("", (string? filter, Guid? programId, string? q, ListEventsHandler handler, CancellationToken ct) => handler.HandleAsync(filter, programId, q, ct));
        events.MapGet("/{id:guid}", async (Guid id, GetEventHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } e ? Results.Ok(e) : Results.NotFound());
        events.MapPost("", async (SaveEventCommand command, CreateEventHandler handler, CancellationToken ct) =>
        {
            var created = await handler.HandleAsync(command, ct);
            return created.Result.Status == Application.ResultStatus.Created
                ? Results.Created($"/events/{created.Result.Id}", new { id = created.Result.Id, count = created.Count })
                : created.Result.ToHttp();
        }).RequirePermission(Permission.ManageEvents);
        events.MapPut("/{id:guid}", async (Guid id, SaveEventCommand command, UpdateEventHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.ManageEvents);
        events.MapPost("/{id:guid}/cancel", async (Guid id, CancelEventCommand command, CancelEventHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.CancelEvents);
        return app;
    }
}
