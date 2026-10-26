using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Mentoring;
using PromiseHub.Application.Website;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>The first endpoint of each Waypoint module (ADR 0043): each names its permission and its module, never the fallback.</summary>
public static class WaypointEndpoints
{
    public static IEndpointRouteBuilder MapWaypointEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/learning/me", (LearnerHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn);
        app.MapGet("/curriculum", (CurriculumHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.AuthorCurriculum);
        app.MapGet("/mentoring/youth", (MentoringHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireModule(ModuleId.Mentoring).RequirePermission(Permission.MentorYouth);
        // Anonymous: the slug chooses the organization, and the handler checks its module (L2-005 criterion 7).
        app.MapGet("/website/{slug}", async (string slug, PublicWebsiteHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(slug, ct) is { } site ? Results.Ok(site) : Results.NotFound()).AllowAnonymous();
        return app;
    }
}
