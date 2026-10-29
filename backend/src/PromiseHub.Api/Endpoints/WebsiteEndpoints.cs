using PromiseHub.Application.Website;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// The public website (L2-132 to L2-134, ADR 0075): every endpoint is anonymous by explicit opt-in; the address chooses the organization and
/// the handlers check its Public website module, so an unknown address, a suspended organization and the module off all answer 404.
/// </summary>
public static class WebsiteEndpoints
{
    public static IEndpointRouteBuilder MapWebsiteEndpoints(this IEndpointRouteBuilder app)
    {
        var site = app.MapGroup("/website/{slug}").AllowAnonymous();
        site.MapGet("", async (string slug, PublicWebsiteHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(slug, ct) is { } profile ? Results.Ok(profile) : Results.NotFound());
        site.MapGet("/content", async (string slug, PublicContentHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(slug, ct) is { } content ? Results.Ok(content) : Results.NotFound());
        return app;
    }
}
