using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Staff;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Staff access (L2-007, L2-009): admins only; always part of the product, not a module.</summary>
public static class StaffEndpoints
{
    public static IEndpointRouteBuilder MapStaffEndpoints(this IEndpointRouteBuilder app)
    {
        var staff = app.MapGroup("/staff").RequirePermission(Permission.ManageStaff);
        staff.MapGet("", (StaffAccessHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        staff.MapDelete("/invitations/{id:guid}", async (Guid id, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.WithdrawAsync(id, ct)).ToHttp());
        staff.MapPut("/{id:guid}/role", async (Guid id, ChangeRoleCommand command, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.ChangeRoleAsync(id, command, ct)).ToHttp());
        staff.MapPut("/{id:guid}/child", async (Guid id, LinkYouthCommand command, LinkYouthHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, command, ct)).ToHttp());
        staff.MapDelete("/{id:guid}", async (Guid id, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.RemoveAsync(id, ct)).ToHttp());
        app.MapPost("/staff/invitations", async (InviteStaffCommand command, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.InviteAsync(command, ct)).ToHttp("/staff/invitations")).RequirePermission(Permission.InviteStaff);
        // Youth accounts from the child record exist only while Learning is on (L2-051, ADR 0045).
        app.MapGet("/children/{id:guid}/youth-account", async (Guid id, YouthInvitationHandler handler, CancellationToken ct) =>
            await handler.AccountAsync(id, ct) is { } account ? Results.Ok(account) : Results.NotFound())
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.ManageStaff);
        app.MapPost("/children/{id:guid}/youth-invitation", async (Guid id, InviteYouthCommand command, YouthInvitationHandler handler, CancellationToken ct) =>
            (await handler.InviteAsync(id, command, ct)).ToHttp("/staff/invitations"))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.ManageStaff);
        app.MapGet("/coverage", (CoverageHandler handler, CancellationToken ct) => handler.ListAsync(ct)).RequirePermission(Permission.AssignStaff);
        app.MapGet("/coverage/mine", (CoverageHandler handler, CancellationToken ct) => handler.MineAsync(ct));
        app.MapPut("/sessions/{id:guid}/staff", async (Guid id, AssignStaffCommand command, CoverageHandler handler, CancellationToken ct) =>
            (await handler.AssignAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.AssignStaff);
        return app;
    }
}
