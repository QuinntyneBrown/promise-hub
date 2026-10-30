using PromiseHub.Application;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// Learning Bond guardian endpoints (L2-162 criterion 6, ADR 0076): anonymous by explicit opt-in, the organization from the link, then the
/// module gate. An unknown link, a suspended organization and the module off all answer 404 with no body.
/// </summary>
public static class LearningBondGuardianEndpoints
{
    public static IEndpointRouteBuilder MapLearningBondGuardianEndpoints(this IEndpointRouteBuilder app)
    {
        var guardian = app.MapGroup("/g/learning-bond/{token}").AllowAnonymous();
        guardian.MapGet(string.Empty, async (string token, LearningBondGuardianHandler handler, HttpContext http, CancellationToken ct) =>
            await handler.GetAsync(new GuardianRequest(token, http.Request.Cookies[GuardianEndpoints.DeviceCookie], http.Request.Headers.UserAgent.ToString()), ct)
                is { } link ? Results.Ok(link) : Results.NotFound());
        // The page and the choice need a verified device (L2-144 criteria 2 and 4); the link check above names no family.
        guardian.MapGet("/page", async (string token, LearningBondGuardianHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.PageAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPost("/choice", async (string token, LearningBondChoiceRequest request, LearningBondGuardianHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.ChooseAsync(GuardianEndpoints.Request(token, http), request, ct)));
        guardian.MapGet("/consent", async (string token, LearningBondConsentHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.GetAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPost("/consents", async (string token, GiveLearningBondConsentRequest request, LearningBondConsentHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.GiveAsync(GuardianEndpoints.Request(token, http), request, ct)));
        guardian.MapGet("/children/{childId:guid}/intake", async (string token, Guid childId, LearningBondIntakeHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.GetAsync(GuardianEndpoints.Request(token, http), childId, ct)));
        guardian.MapPut("/children/{childId:guid}/intake", async (string token, Guid childId, SaveLearningBondIntakeRequest request, LearningBondIntakeHandler handler,
            HttpContext http, CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.SaveAsync(GuardianEndpoints.Request(token, http), childId, request, ct)));
        guardian.MapPost("/children/{childId:guid}/intake/record-fix", async (string token, Guid childId, LearningBondRecordFixRequest request, LearningBondIntakeHandler handler,
            HttpContext http, CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.RequestFixAsync(GuardianEndpoints.Request(token, http), childId, request, ct)));
        guardian.MapGet("/children/{childId:guid}/estimate", async (string token, Guid childId, LearningBondEstimateHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.GetAsync(GuardianEndpoints.Request(token, http), childId, ct)));
        guardian.MapPost("/children/{childId:guid}/applications", async (string token, Guid childId, LearningBondApplicationHandler handler, HttpContext http,
            CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.PrepareAsync(GuardianEndpoints.Request(token, http), childId, ct)));
        guardian.MapPatch("/applications/{id:guid}/fields/{field}", async (string token, Guid id, string field, LearningBondFieldValueRequest request,
            LearningBondApplicationHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.EditFieldAsync(GuardianEndpoints.Request(token, http), id, field, request, ct)));
        guardian.MapPut("/applications/{id:guid}/provider", async (string token, Guid id, ChooseRespProviderRequest request, LearningBondApplicationHandler handler,
            HttpContext http, CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.ChooseProviderAsync(GuardianEndpoints.Request(token, http), id, request, ct)));
        guardian.MapPost("/applications/{id:guid}/submit", async (string token, Guid id, SubmitLearningBondApplicationRequest request, LearningBondSubmitHandler handler,
            HttpContext http, CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.SubmitAsync(GuardianEndpoints.Request(token, http), id, request, ct)));
        guardian.MapGet("/children/{childId:guid}/progress", async (string token, Guid childId, LearningBondProgressHandler handler, HttpContext http,
            CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.GetAsync(GuardianEndpoints.Request(token, http), childId, ct)));
        guardian.MapPost("/documents/{id:guid}/file", async (string token, Guid id, LearningBondDocumentHandler handler, HttpContext http, CancellationToken ct) =>
        {
            IFormCollection form;
            try
            {
                form = await http.Request.ReadFormAsync(ct);
            }
            catch (Exception e) when (e is InvalidDataException or BadHttpRequestException)
            {
                return GuardianEndpoints.ToHttp(GuardianResult.Invalid("file", LearningBondDocumentHandler.FileMessage));
            }
            if (form.Files.GetFile("file") is not { } file)
            {
                return GuardianEndpoints.ToHttp(GuardianResult.Invalid("file", LearningBondDocumentHandler.FileMessage));
            }
            await using var stream = file.OpenReadStream();
            return GuardianEndpoints.ToHttp(await handler.UploadAsync(GuardianEndpoints.Request(token, http), id, file.FileName, file.ContentType, file.Length, stream, ct));
        }).DisableAntiforgery().WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(32 * 1024 * 1024));
        guardian.MapPost("/documents/{id:guid}/send", async (string token, Guid id, LearningBondDocumentHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.SendAsync(GuardianEndpoints.Request(token, http), id, ct)));
        guardian.MapPost("/children/{childId:guid}/pause", async (string token, Guid childId, PauseLearningBondClaimRequest request, LearningBondPauseHandler handler,
            HttpContext http, CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.PauseAsync(GuardianEndpoints.Request(token, http), childId, request, ct)));
        guardian.MapGet("/children/{childId:guid}/paused", async (string token, Guid childId, LearningBondPauseHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.GetAsync(GuardianEndpoints.Request(token, http), childId, ct)));
        guardian.MapPut("/children/{childId:guid}/reminder", async (string token, Guid childId, LearningBondReminderRequest request, LearningBondPauseHandler handler,
            HttpContext http, CancellationToken ct) => GuardianEndpoints.ToHttp(await handler.SetReminderAsync(GuardianEndpoints.Request(token, http), childId, request, ct)));
        guardian.MapDelete("/consents/{id:guid}", async (string token, Guid id, LearningBondWithdrawHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.WithdrawAsync(GuardianEndpoints.Request(token, http), id, ct)));
        guardian.MapPost("/benefits/offer/dismiss", async (string token, LearningBondBenefitsHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.DismissOfferAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapGet("/benefits/consent", async (string token, LearningBondBenefitsHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.ConsentPageAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapGet("/benefits/intake", async (string token, LearningBondBenefitsHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.IntakeAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPut("/benefits/intake", async (string token, SaveBenefitsIntakeRequest request, LearningBondBenefitsHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.SaveIntakeAsync(GuardianEndpoints.Request(token, http), request, ct)));
        guardian.MapGet("/benefits", async (string token, LearningBondBenefitsHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.ListAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPost("/benefits/{key}/document", async (string token, string key, LearningBondBenefitApplicationHandler handler, HttpContext http, CancellationToken ct) =>
        {
            IFormCollection form;
            try
            {
                form = await http.Request.ReadFormAsync(ct);
            }
            catch (Exception e) when (e is InvalidDataException or BadHttpRequestException)
            {
                return GuardianEndpoints.ToHttp(GuardianResult.Invalid("file", LearningBondDocumentHandler.FileMessage));
            }
            if (form.Files.GetFile("file") is not { } file)
            {
                return GuardianEndpoints.ToHttp(GuardianResult.Invalid("file", LearningBondDocumentHandler.FileMessage));
            }
            await using var stream = file.OpenReadStream();
            return GuardianEndpoints.ToHttp(await handler.UploadDocumentAsync(GuardianEndpoints.Request(token, http), key, file.FileName, file.ContentType, file.Length, stream, ct));
        }).DisableAntiforgery().WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(32 * 1024 * 1024));
        guardian.MapPost("/benefits/{key}/applications", async (string token, string key, LearningBondBenefitApplicationHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.PrepareAsync(GuardianEndpoints.Request(token, http), key, ct)));
        guardian.MapPatch("/benefits/applications/{id:guid}/fields/{field}", async (string token, Guid id, string field, LearningBondFieldValueRequest request,
            LearningBondBenefitApplicationHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.EditFieldAsync(GuardianEndpoints.Request(token, http), id, field, request, ct)));
        guardian.MapPost("/benefits/applications/{id:guid}/submit", async (string token, Guid id, SubmitLearningBondApplicationRequest request,
            LearningBondBenefitApplicationHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.SubmitAsync(GuardianEndpoints.Request(token, http), id, request, ct)));
        guardian.MapGet("/benefits/applications/{id:guid}/form", async (string token, Guid id, LearningBondBenefitApplicationHandler handler, HttpContext http, CancellationToken ct) =>
        {
            var (gate, pdf, name) = await handler.FormAsync(GuardianEndpoints.Request(token, http), id, ct);
            return gate is not null ? GuardianEndpoints.ToHttp(gate) : Results.File(pdf!, "application/pdf", name);
        });
        guardian.MapPost("/benefits/applications/{id:guid}/sent", async (string token, Guid id, LearningBondBenefitApplicationHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.MarkSentAsync(GuardianEndpoints.Request(token, http), id, ct)));
        guardian.MapGet("/reminders", async (string token, LearningBondRemindersHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.ListAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPut("/reminders/{id:guid}/off", async (string token, Guid id, LearningBondRemindersHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.TurnOffAsync(GuardianEndpoints.Request(token, http), id, ct)));
        guardian.MapGet("/total", async (string token, LearningBondTotalHandler handler, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await handler.GetAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPost("/agent", async (string token, AskLearningBondAgentRequest request, LearningBondAgent agent, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await agent.AskAsync(GuardianEndpoints.Request(token, http), request, ct)));
        guardian.MapGet("/agent/conversation", async (string token, LearningBondAgent agent, HttpContext http, CancellationToken ct) =>
            GuardianEndpoints.ToHttp(await agent.ConversationAsync(GuardianEndpoints.Request(token, http), ct)));
        guardian.MapPost("/callback", async (string token, CallbackRequest request, LearningBondGuardianHandler handler, HttpContext http, CancellationToken ct) =>
            await handler.RequestCallAsync(new GuardianRequest(token, http.Request.Cookies[GuardianEndpoints.DeviceCookie], http.Request.Headers.UserAgent.ToString()), request, ct)
                switch
                {
                    { Status: ResultStatus.Done, Message: var message } => Results.Ok(new { message }),
                    { Status: ResultStatus.Invalid, Errors: var errors } => Results.Json(new { errors }, statusCode: StatusCodes.Status422UnprocessableEntity),
                    _ => Results.NotFound(),
                });
        return app;
    }
}
