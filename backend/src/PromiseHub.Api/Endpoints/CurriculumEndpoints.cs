using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Curriculum authoring (L2-066, L2-067, ADR 0050): the Learning module and AuthorCurriculum (admins and program directors) on every endpoint.</summary>
public static class CurriculumEndpoints
{
    public static IEndpointRouteBuilder MapCurriculumEndpoints(this IEndpointRouteBuilder app)
    {
        var curriculum = app.MapGroup("/curriculum").RequireModule(ModuleId.Learning).RequirePermission(Permission.AuthorCurriculum);
        curriculum.MapGet("/", (CurriculumHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        curriculum.MapPost("/tracks", async (CreateTrackCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/tracks"));
        curriculum.MapPut("/tracks/{id:guid}/module-order", async (Guid id, ModuleOrderCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.ReorderModulesAsync(id, command.ModuleIds, ct)).ToHttp());
        curriculum.MapPost("/modules", async (CreateModuleCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/modules"));
        curriculum.MapGet("/modules/{id:guid}", async (Guid id, ModuleHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } module ? Results.Ok(module) : Results.NotFound());
        curriculum.MapPut("/modules/{id:guid}", async (Guid id, SaveModuleCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        return app;
    }
}
