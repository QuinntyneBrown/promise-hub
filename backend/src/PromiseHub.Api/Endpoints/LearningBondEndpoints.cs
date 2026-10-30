using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.LearningBond;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Learning Bond staff endpoints (L2-135, L2-162, ADR 0076): signed in, and 404 while the module is off for the caller's organization. The
/// agreement routes are the one exception: they need <c>ManageSettings</c> with Roster and Messages on, because the agreement is accepted
/// before the module can be on (ADR 0077).
/// </summary>
public static class LearningBondEndpoints
{
    public static IEndpointRouteBuilder MapLearningBondEndpoints(this IEndpointRouteBuilder app)
    {
        var learningBond = app.MapGroup("/learning-bond").RequireModule(ModuleId.LearningBond);
        learningBond.MapGet(string.Empty, () => Results.Ok(new LearningBondStatusDto(On: true)));

        var agreement = app.MapGroup("/learning-bond/agreement").RequirePermission(Permission.ManageSettings).RequireModule(ModuleId.Roster).RequireModule(ModuleId.Messages);
        agreement.MapGet(string.Empty, (LearningBondAgreementHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        agreement.MapPost("/acceptances", async (AcceptAgreementRequest request, LearningBondAgreementHandler handler, CancellationToken ct) =>
            (await handler.AcceptAsync(request, ct)).ToHttp("/learning-bond/agreement/acceptances"));
        return app;
    }
}
