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
        curriculum.MapPut("/tracks/{id:guid}/status", async (Guid id, StatusCommand command, TrackCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapPut("/modules/{id:guid}/status", async (Guid id, StatusCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapPut("/modules/{id:guid}/lesson-order", async (Guid id, LessonOrderCommand command, ModuleCommands handler, CancellationToken ct) =>
            (await handler.ReorderLessonsAsync(id, command.LessonIds, ct)).ToHttp());
        curriculum.MapPost("/lessons", async (CreateLessonCommand command, LessonCommands handler, CancellationToken ct) =>
            (await handler.CreateAsync(command, ct)).ToHttp("/curriculum/lessons"));
        curriculum.MapGet("/lessons/{id:guid}", async (Guid id, LessonHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } lesson ? Results.Ok(lesson) : Results.NotFound());
        curriculum.MapPut("/lessons/{id:guid}", async (Guid id, SaveLessonCommand command, LessonCommands handler, CancellationToken ct) =>
            (await handler.UpdateAsync(id, command, ct)).ToHttp());
        curriculum.MapPut("/lessons/{id:guid}/status", async (Guid id, StatusCommand command, LessonCommands handler, CancellationToken ct) =>
            (await handler.SetStatusAsync(id, command.Status, ct)).ToHttp());
        curriculum.MapDelete("/lessons/{id:guid}", async (Guid id, LessonCommands handler, CancellationToken ct) =>
            (await handler.DeleteAsync(id, ct)).ToHttp());
        return app;
    }
}
