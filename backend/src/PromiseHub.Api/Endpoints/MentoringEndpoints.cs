using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Mentoring;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// The mentor's own pages (L2-063 to L2-065, ADR 0049): Mentoring on, Mentor role only, every read scoped by <see cref="MentorScope"/>.
/// Reviews, grading, quiz approval and shared reflections also need Learning (L2-080, L2-081, L2-089, ADR 0057, ADR 0060). At-risk flags are
/// also read and resolved by admins and program directors (L2-091, ADR 0062). Assigning work needs Learning too (L2-092, ADR 0063).
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
        mentoring.MapGet("/youth/{childId:guid}/competencies", async (Guid childId, CompetenciesHandler handler, CancellationToken ct) =>
        {
            var (result, sheet) = await handler.GetAsync(childId, ct);
            return sheet is not null ? Results.Ok(sheet) : result.ToHttp();
        });
        mentoring.MapPut("/youth/{childId:guid}/competencies", async (Guid childId, SaveCompetenciesRequest request, CompetenciesHandler handler, CancellationToken ct) =>
        {
            var (result, sheet) = await handler.SaveAsync(childId, request, ct);
            return sheet is not null ? Results.Ok(sheet) : result.ToHttp();
        });
        mentoring.MapGet("/check-ins", async (Guid? childId, string? kind, MentorCheckInsHandler handler, CancellationToken ct) =>
        {
            var (result, history) = await handler.HistoryAsync(childId, kind, ct);
            return history is not null ? Results.Ok(history) : result.ToHttp();
        });
        mentoring.MapPost("/check-ins", async (LogMentorCheckInRequest request, MentorCheckInsHandler handler, CancellationToken ct) =>
        {
            var (result, checkIn) = await handler.LogAsync(request, ct);
            return checkIn is not null ? Results.Created($"/mentoring/check-ins/{checkIn.Id}", checkIn) : result.ToHttp();
        });
        var flags = app.MapGroup("/mentoring/flags").RequireModule(ModuleId.Mentoring).RequireAnyPermission(Permission.MentorYouth, Permission.ReviewAtRiskFlags);
        flags.MapGet("", (string? status, AtRiskFlagsHandler handler, CancellationToken ct) => handler.ListAsync(status, ct));
        flags.MapPost("", async (RaiseFlagRequest request, AtRiskFlagsHandler handler, CancellationToken ct) =>
            Written(await handler.RaiseAsync(request, ct), flag => Results.Created($"/mentoring/flags/{flag.Id}", flag)));
        flags.MapPost("/{id:guid}/resolve", async (Guid id, ResolveFlagRequest request, AtRiskFlagsHandler handler, CancellationToken ct) =>
            Written(await handler.ResolveAsync(id, request, ct), Results.Ok));
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
        reviews.MapGet("/youth/{childId:guid}/reflections", async (Guid childId, SharedReflectionsHandler handler, CancellationToken ct) =>
        {
            var (result, shared) = await handler.HandleAsync(childId, ct);
            return shared is not null ? Results.Ok(shared) : result.ToHttp();
        });
        reviews.MapGet("/assign-work", (AssignWorkHandler handler, CancellationToken ct) => handler.OptionsAsync(ct));
        reviews.MapPost("/assigned-work", async (AssignWorkRequest request, AssignWorkHandler handler, CancellationToken ct) =>
        {
            var (result, assigned) = await handler.AssignAsync(request, ct);
            return assigned is not null ? Results.Json(assigned, statusCode: StatusCodes.Status201Created) : result.ToHttp();
        });
        reviews.MapGet("/quiz-approvals", (QuizApprovalHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        reviews.MapPost("/quiz-approvals/approve-all", (QuizApprovalHandler handler, CancellationToken ct) => handler.ApproveAllAsync(ct));
        reviews.MapPost("/quiz-attempts/{id:guid}/approve", async (Guid id, ApproveQuizRequest request, QuizApprovalHandler handler, CancellationToken ct) =>
            (await handler.ApproveAsync(id, request, ct)).ToHttp());
        return app;
    }

    /// <summary>A written flag answers through <paramref name="written"/>; a conflict answers 409 with its code (ADR 0062).</summary>
    private static IResult Written(FlagWriteResult result, Func<AtRiskFlagDto, IResult> written) =>
        result.Flag is { } flag ? written(flag)
        : result.Code is { } code ? Results.Json(new { code }, contentType: "application/problem+json", statusCode: StatusCodes.Status409Conflict)
        : result.Result.ToHttp();
}
