using PromiseHub.Api.Authorization;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Staff;

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
        staff.MapDelete("/{id:guid}", async (Guid id, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.RemoveAsync(id, ct)).ToHttp());
        app.MapPost("/staff/invitations", async (InviteStaffCommand command, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.InviteAsync(command, ct)).ToHttp("/staff/invitations")).RequirePermission(Permission.InviteStaff);
        app.MapGet("/coverage", (CoverageHandler handler, CancellationToken ct) => handler.ListAsync(ct)).RequirePermission(Permission.AssignStaff);
        app.MapGet("/coverage/mine", (CoverageHandler handler, CancellationToken ct) => handler.MineAsync(ct));
        app.MapPut("/sessions/{id:guid}/staff", async (Guid id, AssignStaffCommand command, CoverageHandler handler, CancellationToken ct) =>
            (await handler.AssignAsync(id, command, ct)).ToHttp()).RequirePermission(Permission.AssignStaff);
        return app;
    }
}
