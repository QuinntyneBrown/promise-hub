using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Learning;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// A youth's lessons and quizzes (L2-068 to L2-070, L2-075 to L2-078, ADR 0051, ADR 0055, ADR 0056): the Learning module, the Learn permission, then the consent gate (L2-056) and the
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
        learning.MapGet("/coding/{id:guid}", async (Guid id, CodingLessonHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        learning.MapPut("/coding/{id:guid}/progress", async (Guid id, SaveCodingRequest request, CodingProgressCommand handler, CancellationToken ct) =>
            (await handler.SaveAsync(id, request, ct)).ToHttp());
        learning.MapPost("/coding/{id:guid}/submission", async (Guid id, SubmitProjectRequest request, ProjectSubmissionCommand handler, CancellationToken ct) =>
        {
            var submitted = await handler.SubmitAsync(id, request, ct);
            return submitted.Status == Application.ResultStatus.Done
                ? Results.Created($"/learning/coding/{id}/submission", new { id = submitted.Value })
                : submitted.ToHttp();
        });
        learning.MapGet("/quizzes/{id:guid}", async (Guid id, QuizIntroHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        learning.MapPost("/quizzes/{id:guid}/attempts", async (Guid id, QuizAttemptCommand handler, CancellationToken ct) => (await handler.StartAsync(id, ct)).ToHttp());
        learning.MapPut("/attempts/{id:guid}/answers", async (Guid id, SaveAnswersRequest request, QuizAttemptCommand handler, CancellationToken ct) =>
        {
            var saved = await handler.SaveAsync(id, request, ct);
            return saved.Status == Application.ResultStatus.Done ? Results.NoContent() : saved.ToHttp();
        });
        learning.MapGet("/attempts/{id:guid}", async (Guid id, QuizResultHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        learning.MapPost("/attempts/{id:guid}/submit", async (Guid id, SaveAnswersRequest request, QuizAttemptCommand handler, CancellationToken ct) =>
        {
            var submitted = await handler.SubmitAsync(id, request, ct);
            return submitted.Status == Application.ResultStatus.Done ? Results.Ok(new { id = submitted.Value }) : submitted.ToHttp();
        });
        learning.MapGet("/assignments/{id:guid}", async (Guid id, AssignmentBriefHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        // Streamed under the youth's session cookie with range requests, so the player can seek (ADR 0051).
        learning.MapGet("/lessons/{id:guid}/video", async (Guid id, LessonVideoStream handler, CancellationToken ct) =>
        {
            var video = await handler.OpenAsync(id, ct);
            return video.Value is { } v ? Results.Stream(v.Content, v.ContentType, enableRangeProcessing: true) : video.ToHttp();
        });
        return app;
    }
}
