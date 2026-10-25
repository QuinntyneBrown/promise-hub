using PromiseHub.Api.Modules;
using PromiseHub.Application.Incidents;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>The incident log (L2-023): any staff member reports; supervisors read the log, everyone else their own reports.</summary>
public static class IncidentEndpoints
{
    public static IEndpointRouteBuilder MapIncidentEndpoints(this IEndpointRouteBuilder app)
    {
        var incidents = app.MapGroup("/incidents").RequireModule(ModuleId.Incidents);
        incidents.MapGet("", (IncidentQueries queries, CancellationToken ct) => queries.ListAsync(ct));
        incidents.MapGet("/form", (IncidentQueries queries, CancellationToken ct) => queries.FormAsync(ct));
        incidents.MapGet("/{id:guid}", async (Guid id, IncidentQueries queries, CancellationToken ct) =>
            await queries.GetAsync(id, ct) is { } incident ? Results.Ok(incident) : Results.NotFound());
        incidents.MapPost("", async (ReportIncidentCommand command, ReportIncidentHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(command, ct)).ToHttp("/incidents"));
        return app;
    }
}
