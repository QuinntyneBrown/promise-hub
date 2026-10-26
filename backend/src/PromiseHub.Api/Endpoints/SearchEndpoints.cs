using PromiseHub.Api.Modules;
using PromiseHub.Application.Search;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Global search across the organization's roster and events.</summary>
public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/search", (string? q, SearchHandler handler, CancellationToken ct) => handler.HandleAsync(q, ct)).RequireModule(ModuleId.Roster);
        return app;
    }
}
