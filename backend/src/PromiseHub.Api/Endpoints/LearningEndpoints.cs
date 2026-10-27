using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Learning;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// A youth's lessons (L2-068 to L2-070, ADR 0051): the Learning module, the Learn permission, then the consent gate (L2-056) and the
/// placement gate (L2-060) on every endpoint. Locks and visibility are decided by LearnerProgress in the handlers.
/// </summary>
public static class LearningEndpoints
{
    public static IEndpointRouteBuilder MapLearningEndpoints(this IEndpointRouteBuilder app)
    {
        var learning = app.MapGroup("/learning").RequireModule(ModuleId.Learning).RequirePermission(Permission.Learn).RequireGuardianConsent().RequirePlacement();
        learning.MapGet("/home", (LearningHomeHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        learning.MapGet("/tracks/{id:guid}", async (Guid id, TrackViewHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        learning.MapGet("/modules/{id:guid}", async (Guid id, ModuleViewHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        learning.MapGet("/lessons/{id:guid}", async (Guid id, LessonViewHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        learning.MapPost("/lessons/{id:guid}/complete", async (Guid id, LessonCompletion handler, CancellationToken ct) => (await handler.CompleteAsync(id, ct)).ToHttp());
        return app;
    }
}
