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
        staff.MapPost("/invitations", async (InviteStaffCommand command, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.InviteAsync(command, ct)).ToHttp("/staff/invitations"));
        staff.MapDelete("/invitations/{id:guid}", async (Guid id, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.WithdrawAsync(id, ct)).ToHttp());
        staff.MapPut("/{id:guid}/role", async (Guid id, ChangeRoleCommand command, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.ChangeRoleAsync(id, command, ct)).ToHttp());
        staff.MapDelete("/{id:guid}", async (Guid id, StaffAccessHandler handler, CancellationToken ct) =>
            (await handler.RemoveAsync(id, ct)).ToHttp());
        return app;
    }
}
