using Microsoft.AspNetCore.Mvc;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Programs;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Programs and their rosters: Roster data, read by Roll Call and Slips (ADR 0008).</summary>
public static class ProgramEndpoints
{
    public static IEndpointRouteBuilder MapProgramEndpoints(this IEndpointRouteBuilder app)
    {
        var programs = app.MapGroup("/programs").RequireModule(ModuleId.Roster);
        programs.MapGet("", (string? status, ListProgramsHandler handler, CancellationToken ct) => handler.HandleAsync(status, ct));
        programs.MapGet("/{id:guid}", async (Guid id, GetProgramHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } program ? Results.Ok(program) : Results.NotFound());
        programs.MapPost("", async (SaveProgramCommand command, CreateProgramHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(command, ct)).ToHttp("/programs")).RequirePermission(Permission.ManagePrograms);
        programs.MapPut("/{id:guid}", async (Guid id, SaveProgramCommand command, UpdateProgramHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        programs.MapPost("/{id:guid}/archive", async (Guid id, ArchiveProgramRequest request, ArchiveProgramHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, request.ConfirmName, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        programs.MapPost("/{id:guid}/restore", async (Guid id, RestoreProgramHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        programs.MapPost("/{id:guid}/enrollment/open", async (Guid id, PromiseHub.Application.Enrollment.OpenEnrollmentHandler handler, CancellationToken ct) =>
            await handler.OpenAsync(id, ct) is { } url ? Results.Ok(new { url }) : Results.NotFound()).RequirePermission(Permission.ManagePrograms);
        programs.MapPost("/{id:guid}/enrollment/close", async (Guid id, PromiseHub.Application.Enrollment.OpenEnrollmentHandler handler, CancellationToken ct) =>
            (await handler.CloseAsync(id, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        programs.MapPost("/{id:guid}/enrollments", async (Guid id, EnrollRequest request, EnrollChildHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, request.ChildId, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        programs.MapDelete("/{id:guid}/enrollments/{childId:guid}", async (Guid id, Guid childId, [FromBody] RemoveFromRosterRequest request, RemoveFromRosterHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, childId, request.Reason, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        return app;
    }
}
