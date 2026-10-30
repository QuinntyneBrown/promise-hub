using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Provider progress for Learning Bond applications (L2-150): anonymous, trusted only by the provider's signature over the raw body; the
/// handler gates per organization. 401 unsigned, 404 unknown or off, 400 not an event, 200 applied or already applied.
/// </summary>
public static class LearningBondWebhookEndpoints
{
    public static IEndpointRouteBuilder MapLearningBondWebhookEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/learning-bond/webhooks/providers/{provider}", async (string provider, HttpContext http, LearningBondWebhookHandler handler, CancellationToken ct) =>
        {
            using var reader = new StreamReader(http.Request.Body);
            var body = await reader.ReadToEndAsync(ct);
            return await handler.HandleAsync(provider, body, http.Request.Headers["X-PromiseHub-Signature"].FirstOrDefault(), ct) switch
            {
                ProviderWebhookOutcome.Applied => Results.Ok(),
                ProviderWebhookOutcome.Unauthorized => Results.Unauthorized(),
                ProviderWebhookOutcome.NotFound => Results.NotFound(),
                _ => Results.BadRequest(),
            };
        }).AllowAnonymous();
        app.MapPost("/learning-bond/webhooks/programs/{program}", async (string program, HttpContext http, LearningBondProgramWebhookHandler handler, CancellationToken ct) =>
        {
            using var reader = new StreamReader(http.Request.Body);
            var body = await reader.ReadToEndAsync(ct);
            return await handler.HandleAsync(program, body, http.Request.Headers["X-PromiseHub-Signature"].FirstOrDefault(), ct) switch
            {
                ProviderWebhookOutcome.Applied => Results.Ok(),
                ProviderWebhookOutcome.Unauthorized => Results.Unauthorized(),
                ProviderWebhookOutcome.NotFound => Results.NotFound(),
                _ => Results.BadRequest(),
            };
        }).AllowAnonymous();
        return app;
    }
}
