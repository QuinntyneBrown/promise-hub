using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// The named signer's link (L2-137, ADR 0078): anonymous by explicit opt-in and outside the Learning Bond module gate, since the agreement
/// is accepted before the module can be on. The organization comes from the link. A dead link answers 410 naming the organization; an
/// unknown one answers 404 with no body.
/// </summary>
public static class LearningBondSignerEndpoints
{
    public static IEndpointRouteBuilder MapLearningBondSignerEndpoints(this IEndpointRouteBuilder app)
    {
        var signer = app.MapGroup("/sign/learning-bond/{token}").AllowAnonymous();
        signer.MapGet(string.Empty, async (string token, LearningBondSignerLinkHandler handler, CancellationToken ct) =>
            ToHttp(await handler.GetAsync(token, ct), Results.Ok));
        signer.MapPost("/acceptances", async (string token, AcceptAgreementRequest request, LearningBondSignerLinkHandler handler, CancellationToken ct) =>
            ToHttp(await handler.AcceptAsync(token, request, ct), value => Results.Json(value, statusCode: StatusCodes.Status201Created)));
        return app;
    }

    private static IResult ToHttp<T>(LearningBondSignerOutcome<T> outcome, Func<T, IResult> open) => outcome.Status switch
    {
        LearningBondSignerLinkStatus.Open => open(outcome.Value!),
        LearningBondSignerLinkStatus.Invalid => Results.Json(new { errors = outcome.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
        LearningBondSignerLinkStatus.Expired => Results.Json(new { code = "link-expired", organization = outcome.Organization, message = outcome.Message },
            statusCode: StatusCodes.Status410Gone),
        _ => Results.NotFound(),
    };
}
