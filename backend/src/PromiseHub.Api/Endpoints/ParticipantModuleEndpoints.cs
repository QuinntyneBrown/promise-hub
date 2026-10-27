using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Website;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>The first endpoint of each of the Learning and Public website modules (ADR 0043); Mentoring has MentoringEndpoints and curriculum authoring CurriculumEndpoints: each names its permission and its module, never the fallback.</summary>
public static class ParticipantModuleEndpoints
{
    public static IEndpointRouteBuilder MapParticipantModuleEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/learning/me", (LearnerHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn);
        // Open to a gated youth, so the gate can ask a guardian (L2-056 criterion 3).
        app.MapPost("/learning/consent-request", async (ConsentRequestHandler handler, CancellationToken ct) =>
            ConsentRequestHttp.ToHttp(await handler.RequestAsync(ct)))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn);
        // First-run setup (L2-059, ADR 0047): the caller's own setup only, after a guardian consents when one must.
        app.MapGet("/learning/onboarding", (OnboardingHandler handler, CancellationToken ct) => handler.GetAsync(ct))
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn).RequireGuardianConsent();
        app.MapPut("/learning/onboarding", async (SaveOnboardingRequest request, OnboardingHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(request, ct)).ToHttp())
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn).RequireGuardianConsent();
        app.MapPost("/learning/onboarding/complete", async (OnboardingHandler handler, CancellationToken ct) =>
            (await handler.CompleteAsync(ct)).ToHttp())
            .RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn).RequireGuardianConsent();
        // Anonymous: the slug chooses the organization, and the handler checks its module (L2-005 criterion 7).
        app.MapGet("/website/{slug}", async (string slug, PublicWebsiteHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(slug, ct) is { } site ? Results.Ok(site) : Results.NotFound()).AllowAnonymous();
        return app;
    }
}
