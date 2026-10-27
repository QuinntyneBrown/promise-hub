using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Enrollment;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>The application pipeline: list, read, notes and placement (Roster module; admins and program directors; L2-072).</summary>
public static class ApplicationEndpoints
{
    public static IEndpointRouteBuilder MapApplicationEndpoints(this IEndpointRouteBuilder app)
    {
        var applications = app.MapGroup("/applications").RequireModule(ModuleId.Roster).RequirePermission(Permission.ReviewEnrollments);
        applications.MapGet("", (string? status, ApplicationsHandler handler, CancellationToken ct) => handler.ListAsync(status, ct));
        applications.MapGet("/{id:guid}", async (Guid id, ApplicationsHandler handler, CancellationToken ct) =>
            await handler.GetAsync(id, ct) is { } application ? Results.Ok(application) : Results.NotFound());
        applications.MapPost("/{id:guid}/notes", async (Guid id, AddApplicationNoteCommand command, ApplicationsHandler handler, CancellationToken ct) =>
            (await handler.AddNoteAsync(id, command, ct)).ToHttp($"/applications/{id}/notes"));
        return app;
    }
}
