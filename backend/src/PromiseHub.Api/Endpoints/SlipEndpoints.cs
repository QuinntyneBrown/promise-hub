using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Slips;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Writing, sending, scheduling, editing and tracking permission slips: the Permission slips module.</summary>
public static class SlipEndpoints
{
    public static IEndpointRouteBuilder MapSlipEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/events/{eventId:guid}/slip", async (Guid eventId, GetSlipHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(eventId, ct) is { } slip ? Results.Ok(slip) : Results.NotFound()).RequireModule(ModuleId.Slips);
        app.MapPut("/events/{eventId:guid}/slip", async (Guid eventId, SaveSlipCommand command, SaveSlipHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(eventId, command, ct)).ToHttp()).RequireModule(ModuleId.Slips).RequirePermission(Permission.ManageSlips);

        var slips = app.MapGroup("/slips").RequireModule(ModuleId.Slips);
        slips.MapGet("/", (ListSlipsHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        slips.MapPost("/{id:guid}/send", async (Guid id, SendSlipCommand command, SendSlipHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.ManageSlips);
        slips.MapPost("/{id:guid}/send-now", async (Guid id, SendSlipNowHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, ct)).ToHttp()).RequirePermission(Permission.ManageSlips);
        slips.MapPost("/{id:guid}/cancel-send", async (Guid id, CancelSlipSendHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, ct)).ToHttp()).RequirePermission(Permission.ManageSlips);
        slips.MapPut("/{id:guid}", async (Guid id, EditSlipCommand command, EditSlipHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.ManageSlips);
        slips.MapGet("/{id:guid}/unsigned", async (Guid id, GetUnsignedHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } unsigned ? Results.Ok(unsigned) : Results.NotFound());
        slips.MapPost("/{id:guid}/remind", async (Guid id, RemindNowCommand command, RemindNowHandler handler, CancellationToken ct) =>
        {
            var (result, value) = await handler.HandleAsync(id, command, ct);
            return value is not null ? Results.Ok(value) : result.ToHttp();
        }).RequirePermission(Permission.ManageSlips);
        slips.MapPost("/{id:guid}/sign-on-tablet", async (Guid id, SignOnTabletCommand command, SignOnTabletHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.RunSessions);
        app.MapGet("/sessions/{id:guid}/clearance", async (Guid id, GetClearanceHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } clearance ? Results.Ok(clearance) : Results.NotFound()).RequireModule(ModuleId.Slips);
        return app;
    }
}
