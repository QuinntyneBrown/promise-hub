using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Enrollment;
using PromiseHub.Application.Identity;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Staff review of enrollments: the queue and decisions, one or in bulk (Roster module; admins and program directors).</summary>
public static class EnrollmentEndpoints
{
    public static IEndpointRouteBuilder MapEnrollmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/programs/{id:guid}/enrollments", async (Guid id, string? status, ListEnrollmentRequestsHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, status, ct) is { } list ? Results.Ok(list) : Results.NotFound())
            .RequireModule(ModuleId.Roster).RequirePermission(Permission.ReviewEnrollments);
        var enrollments = app.MapGroup("/enrollments").RequireModule(ModuleId.Roster).RequirePermission(Permission.ReviewEnrollments);
        enrollments.MapPost("/{id:guid}/review", async (Guid id, ReviewEnrollmentCommand command, ReviewEnrollmentHandler handler, CancellationToken ct) =>
            (await handler.ReviewAsync(id, command, ct)).ToHttp());
        enrollments.MapPost("/review", async (BulkReviewCommand command, ReviewEnrollmentHandler handler, CancellationToken ct) =>
            (await handler.BulkAsync(command, ct)).ToHttp());
        return app;
    }
}
