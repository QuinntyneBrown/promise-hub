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

        // Settings › Learning Bond (L2-138, L2-139): admins only, behind the module gate.
        var settings = learningBond.MapGroup(string.Empty).RequirePermission(Permission.ManageSettings);
        settings.MapGet("/settings", (LearningBondSettingsHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapPut("/settings", async (SaveLearningBondSettingsRequest request, LearningBondSettingsHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(request, ct)).ToHttp());

        var agreement = app.MapGroup("/learning-bond/agreement").RequirePermission(Permission.ManageSettings).RequireModule(ModuleId.Roster).RequireModule(ModuleId.Messages);
        agreement.MapGet(string.Empty, (LearningBondAgreementHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        agreement.MapPost("/acceptances", async (AcceptAgreementRequest request, LearningBondAgreementHandler handler, CancellationToken ct) =>
            (await handler.AcceptAsync(request, ct)).ToHttp("/learning-bond/agreement/acceptances"));
        agreement.MapPost("/signers", async (RequestSignerRequest request, LearningBondSignerHandler handler, CancellationToken ct) =>
            (await handler.RequestAsync(request, ct)).ToHttp("/learning-bond/agreement/signers"));
        agreement.MapPost("/signers/{id:guid}/resend", async (Guid id, LearningBondSignerHandler handler, CancellationToken ct) =>
            (await handler.ResendAsync(id, ct)).ToHttp());
        agreement.MapDelete("/signers/{id:guid}", async (Guid id, LearningBondSignerHandler handler, CancellationToken ct) =>
            (await handler.CancelAsync(id, ct)).ToHttp());
        return app;
    }
}
