using PromiseHub.Application.Organizations;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Attendance;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Sessions and check-in (Roll Call), sign-out (Pickup) and Quick Cards. A session is an event (ADR 0009).</summary>
public static class AttendanceEndpoints
{
    public static IEndpointRouteBuilder MapAttendanceEndpoints(this IEndpointRouteBuilder app)
    {
        var sessions = app.MapGroup("/sessions").RequireModule(ModuleId.RollCall);
        // A cohort's history and rates (L2-097): staff who review attendance and mentors, their cohorts only.
        app.MapGet("/attendance", async (Guid? programId, AttendanceHistoryHandler handler, CancellationToken ct) =>
        {
            var (status, history) = await handler.HandleAsync(programId, ct);
            return history is not null ? Results.Ok(history) : new Application.Result(status).ToHttp();
        }).RequireModule(ModuleId.RollCall).RequirePermission(Permission.ReviewAttendance);
        // Volunteers run their assigned sessions without the staff app (ADR 0043).
        sessions.MapGet("/today", (TodaySessionsHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireAnyPermission(Permission.UseStaffApp, Permission.RunSessions);
        // A person's own schedule (L2-101, ADR 0066): the sessions they are assigned to in the next four weeks.
        sessions.MapGet("/mine", (MyScheduleHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequirePermission(Permission.RunSessions);
        sessions.MapGet("/{id:guid}/roster", async (Guid id, GetSessionRosterHandler handler, CancellationToken ct) =>
        {
            var (status, roster) = await handler.HandleAsync(id, ct);
            return roster is not null ? Results.Ok(roster) : new Application.Result(status).ToHttp();
        }).RequireAnyPermission(Permission.UseStaffApp, Permission.RunSessions);
        sessions.MapPost("/{id:guid}/check-ins", async (Guid id, CheckInCommand command, CheckInHandler handler, CancellationToken ct) =>
            Ok(await handler.HandleAsync(id, command, ct))).RequirePermission(Permission.RunSessions);
        sessions.MapPost("/{id:guid}/absences", async (Guid id, MarkAbsentCommand command, MarkAbsentHandler handler, CancellationToken ct) =>
            Ok(await handler.HandleAsync(id, command, ct))).RequirePermission(Permission.RunSessions);
        sessions.MapPost("/{id:guid}/end", async (Guid id, EndSessionCommand command, EndSessionHandler handler, CancellationToken ct) =>
        {
            var (status, summary) = await handler.EndAsync(id, command, ct);
            return summary is not null ? Results.Ok(summary) : new Application.Result(status).ToHttp();
        }).RequirePermission(Permission.RunSessions);
        // Corrections after the fact (L2-097): admins and program directors, audited with a reason.
        sessions.MapPut("/{id:guid}/attendance/{childId:guid}", async (Guid id, Guid childId, CorrectAttendanceRequest request, CorrectAttendanceHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, childId, request, ct)).ToHttp()).RequirePermission(Permission.CorrectAttendance);
        sessions.MapPut("/{id:guid}/notes", async (Guid id, SessionNotesCommand command, EndSessionHandler handler, CancellationToken ct) =>
            (await handler.SaveNotesAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.RunSessions);
        sessions.MapPost("/{id:guid}/walk-ins", async (Guid id, AddWalkInCommand command, AddWalkInHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.RunSessions);
        sessions.MapPost("/{id:guid}/sign-outs", async (Guid id, SignOutCommand command, SignOutHandler handler, CancellationToken ct) =>
            Ok(await handler.HandleAsync(id, command, ct))).RequireModule(ModuleId.Pickup).RequirePermission(Permission.RunSessions);
        app.MapGet("/children/{id:guid}/pickups", async (Guid id, GetPickupOptionsHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } pickups ? Results.Ok(pickups) : Results.NotFound()).RequireModule(ModuleId.Pickup);
        sessions.MapPost("/{id:guid}/pickup-requests", async (Guid id, AskForPickupCommand command, PickupRequestHandler handler, CancellationToken ct) =>
            (await handler.AskAsync(id, command, ct)).ToHttp("/pickup-requests")).RequireModule(ModuleId.Pickup).RequirePermission(Permission.RunSessions);
        app.MapGet("/pickup-requests/{id:guid}", async (Guid id, PickupRequestHandler handler, CancellationToken ct) =>
            await handler.GetAsync(id, ct) is { } request ? Results.Ok(request) : Results.NotFound()).RequireModule(ModuleId.Pickup);
        app.MapPost("/children/{id:guid}/pickups", async (Guid id, AddPickupCommand command, ApprovedPickupsHandler handler, ITenantContext tenant, CancellationToken ct) =>
            (await handler.AddAsync(id, command, false, tenant.ActorName, null, ct)).ToHttp($"/children/{id}/pickups")).RequireModule(ModuleId.Pickup).RequirePermission(Permission.ManagePickups);
        app.MapDelete("/children/{id:guid}/pickups/{pickupId:guid}", async (Guid id, Guid pickupId, ApprovedPickupsHandler handler, ITenantContext tenant, CancellationToken ct) =>
            (await handler.RemoveAsync(id, pickupId, false, tenant.ActorName, null, ct)).ToHttp()).RequireModule(ModuleId.Pickup).RequirePermission(Permission.ManagePickups);
        app.MapGet("/children/{id:guid}/quick-card", async (Guid id, GetQuickCardHandler handler, HttpContext http, CancellationToken ct) =>
        {
            // The offline copy belongs to the app, never to an HTTP cache.
            http.Response.Headers.CacheControl = "private, no-store";
            return await handler.HandleAsync(id, ct) is { } card ? Results.Ok(card) : Results.NotFound();
        }).RequireModule(ModuleId.QuickCards);
        return app;
    }

    /// <summary>Attendance writes answer 200 so a repeated tap and the first one look the same to the client.</summary>
    private static IResult Ok(Application.Result result) =>
        result.Status == Application.ResultStatus.Done ? Results.Ok(new { status = "saved" }) : result.ToHttp();
}
