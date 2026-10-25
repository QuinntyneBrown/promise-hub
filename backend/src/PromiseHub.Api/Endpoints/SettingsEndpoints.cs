using PromiseHub.Api.Authorization;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/settings").RequirePermission(Permission.ManageSettings);
        settings.MapGet("/organization", (GetOrganizationSettingsHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        return app;
    }
}
