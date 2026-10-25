using PromiseHub.Application.Households;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SessionEndpoints
{
    public static IEndpointRouteBuilder MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/me", (GetSessionHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        return app;
    }

    public static IEndpointRouteBuilder MapChildEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/children/{id:guid}", async (Guid id, GetChildHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } child ? Results.Ok(child) : Results.NotFound());
        return app;
    }
}
