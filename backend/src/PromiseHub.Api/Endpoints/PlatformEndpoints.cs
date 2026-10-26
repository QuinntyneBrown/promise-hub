using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Platform administration of organizations (L2-003). The handler refuses anyone who is not a platform admin.</summary>
public static class PlatformEndpoints
{
    public static IEndpointRouteBuilder MapPlatformEndpoints(this IEndpointRouteBuilder app)
    {
        var platform = app.MapGroup("/platform/organizations");
        platform.MapGet(string.Empty, async (string? q, string? plan, string? status, PlatformOrganizationsHandler handler, CancellationToken ct) =>
            await handler.ListAsync(q, plan, status, ct) is { } list ? Results.Ok(list) : Results.Forbid());
        platform.MapPost(string.Empty, async (AddOrganizationCommand command, PlatformOrganizationsHandler handler, CancellationToken ct) =>
            (await handler.AddAsync(command, ct)).ToHttp("/platform/organizations"));
        platform.MapPost("/{id:guid}/suspend", async (Guid id, SuspendOrganizationCommand command, PlatformOrganizationsHandler handler, CancellationToken ct) =>
            (await handler.SuspendAsync(id, command, ct)).ToHttp());
        platform.MapPost("/{id:guid}/reinstate", async (Guid id, PlatformOrganizationsHandler handler, CancellationToken ct) =>
            (await handler.ReinstateAsync(id, ct)).ToHttp());
        return app;
    }
}
