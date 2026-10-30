using PromiseHub.Api.Modules;
using PromiseHub.Application.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Learning Bond staff endpoints (L2-135, L2-162, ADR 0076): signed in, and 404 while the module is off for the caller's organization.
/// Prompt 82 adds the module check every later staff screen builds on; the agreement routes arrive with prompt 83.
/// </summary>
public static class LearningBondEndpoints
{
    public static IEndpointRouteBuilder MapLearningBondEndpoints(this IEndpointRouteBuilder app)
    {
        var learningBond = app.MapGroup("/learning-bond").RequireModule(ModuleId.LearningBond);
        learningBond.MapGet(string.Empty, () => Results.Ok(new LearningBondStatusDto(On: true)));
        return app;
    }
}
