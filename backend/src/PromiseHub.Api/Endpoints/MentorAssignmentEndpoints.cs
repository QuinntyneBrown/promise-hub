using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Mentoring;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>A cohort's mentors (L2-062, ADR 0048): Roster data read by Mentoring, so both modules must be on; writes need ManagePrograms.</summary>
public static class MentorAssignmentEndpoints
{
    public static IEndpointRouteBuilder MapMentorAssignmentEndpoints(this IEndpointRouteBuilder app)
    {
        var cohort = app.MapGroup("/programs/{id:guid}").RequireModule(ModuleId.Roster).RequireModule(ModuleId.Mentoring);
        cohort.MapGet("/mentoring", async (Guid id, CohortMentoringHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } mentoring ? Results.Ok(mentoring) : Results.NotFound());
        cohort.MapPut("/mentors", async (Guid id, SetCohortMentorsRequest request, SetCohortMentorsHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(id, request.LeadMentorId, request.SupportingMentorIds, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        cohort.MapPut("/youth/{childId:guid}/mentor", async (Guid id, Guid childId, AssignMentorRequest request, AssignYouthMentorHandler handler, CancellationToken ct) =>
            (await handler.AssignAsync(id, childId, request.MentorId, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        cohort.MapDelete("/youth/{childId:guid}/mentor", async (Guid id, Guid childId, AssignYouthMentorHandler handler, CancellationToken ct) =>
            (await handler.RemoveAsync(id, childId, ct)).ToHttp()).RequirePermission(Permission.ManagePrograms);
        return app;
    }
}
