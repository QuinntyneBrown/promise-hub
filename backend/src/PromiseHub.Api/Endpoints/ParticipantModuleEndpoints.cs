using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Mentoring;
using PromiseHub.Application.Website;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>The first endpoint of each of the Learning, Mentoring and Public website modules (ADR 0043): each names its permission and its module, never the fallback.</summary>
public static class ParticipantModuleEndpoints
{
    public static IEndpointRouteBuilder MapParticipantModuleEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/learning/me", (LearnerHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn);
        // Youth work: closed to a youth under the consent age until a guardian consents (L2-056, L2-057, ADR 0046). Empty until prompt 57.
        app.MapGet("/learning/lessons", () => new LessonsDto([]))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn).RequireGuardianConsent();
        // Open to a gated youth, so the gate can ask a guardian (L2-056 criterion 3).
        app.MapPost("/learning/consent-request", async (ConsentRequestHandler handler, CancellationToken ct) =>
            ConsentRequestHttp.ToHttp(await handler.RequestAsync(ct)))
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
