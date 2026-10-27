using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Mentoring;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>The mentor's own pages (L2-063 to L2-065, ADR 0049): Mentoring on, Mentor role only, every read scoped by <see cref="MentorScope"/>.</summary>
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
        return app;
    }
}
