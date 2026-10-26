using PromiseHub.Api.Authentication;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SessionEndpoints
{
    public static IEndpointRouteBuilder MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/me", (GetSessionHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        app.MapGet("/me/organizations", (SwitchOrganizationHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        app.MapPost("/me/organization", async (SwitchOrganizationCommand command, SwitchOrganizationHandler handler, HttpContext http, CancellationToken ct) =>
        {
            if (await handler.SwitchAsync(command, ct) is not { } membershipId)
            {
                return Results.NotFound();
            }
            await SessionCookie.ReissueAsync(http, membershipId);
            return Results.NoContent();
        });
        return app;
    }
}
