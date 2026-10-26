using PromiseHub.Api.Modules;
using PromiseHub.Application.Reports;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Today's summary for staff; Roster is the data every card reads.</summary>
public static class TodayEndpoints
{
    public static IEndpointRouteBuilder MapTodayEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/today", (TodayHandler handler, CancellationToken ct) => handler.HandleAsync(ct)).RequireModule(ModuleId.Roster);
        return app;
    }
}
