using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Mentoring;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// The mentor's own pages (L2-063 to L2-065, ADR 0049): Mentoring on, Mentor role only, every read scoped by <see cref="MentorScope"/>.
/// Reviews, grading and quiz approval also need Learning (L2-080, L2-081, ADR 0057).
/// </summary>
public static class MentoringEndpoints
{
    public static IEndpointRouteBuilder MapMentoringEndpoints(this IEndpointRouteBuilder app)
    {
        var mentoring = app.MapGroup("/mentoring").RequireModule(ModuleId.Mentoring).RequirePermission(Permission.MentorYouth);
        mentoring.MapGet("/youth", (MentoringHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        mentoring.MapGet("/dashboard", (MentorDashboardHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        mentoring.MapGet("/youth/{childId:guid}", async (Guid childId, MentorYouthRecordHandler handler, CancellationToken ct) =>
        {
            var (status, record) = await handler.HandleAsync(childId, ct);
            return record is not null ? Results.Ok(record) : new Application.Result(status).ToHttp();
        });
        mentoring.MapGet("/cohorts/{programId:guid}", async (Guid programId, MentorCohortHandler handler, CancellationToken ct) =>
        {
            var (status, cohort) = await handler.HandleAsync(programId, ct);
            return cohort is not null ? Results.Ok(cohort) : new Application.Result(status).ToHttp();
        });
        var reviews = mentoring.MapGroup("").RequireModule(ModuleId.Learning);
        reviews.MapGet("/reviews", (ReviewQueueHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        reviews.MapGet("/submissions/{id:guid}", async (Guid id, SubmissionReviewHandler handler, CancellationToken ct) => (await handler.HandleAsync(id, ct)).ToHttp());
        reviews.MapGet("/submissions/{id:guid}/file", async (Guid id, SubmissionReviewHandler handler, CancellationToken ct) =>
        {
            var file = await handler.FileAsync(id, ct);
            return file.Value is { } f ? Results.File(f.Content, f.ContentType, f.FileName) : file.ToHttp();
        });
        reviews.MapPost("/submissions/{id:guid}/grade", async (Guid id, GradeRequest request, GradeSubmissionHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, request, ct)).ToHttp());
        return app;
    }
}
