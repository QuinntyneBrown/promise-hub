using PromiseHub.Application.Households;

namespace PromiseHub.Api.Endpoints;

public static class ChildEndpoints
{
    public static IEndpointRouteBuilder MapChildEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/children/{id:guid}", async (Guid id, GetChildHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } child ? Results.Ok(child) : Results.NotFound());
        return app;
    }
}
