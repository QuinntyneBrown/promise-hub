using PromiseHub.Application.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SessionEndpoints
{
    public static IEndpointRouteBuilder MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/me", (GetSessionHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        return app;
    }
}
