using PromiseHub.Application;
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

        // A household's card and the invitation at the door (L2-140 criteria 4, 5 and 8): staff whose role is in the status roles, checked
        // by the handler since the organization chooses them.
        learningBond.MapGet("/households/{id:guid}", async (Guid id, LearningBondHouseholdHandler handler, CancellationToken ct) =>
            await handler.GetAsync(id, ct) switch
            {
                (ResultStatus.Done, { } card) => Results.Ok(card),
                (ResultStatus.Forbidden, _) => Result.Forbidden.ToHttp(),
                _ => Results.NotFound(),
            });
        learningBond.MapPost("/households/{id:guid}/invitations", async (Guid id, LearningBondHouseholdHandler handler, CancellationToken ct) =>
            await handler.InviteAsync(id, ct) switch
            {
                { Status: ResultStatus.Created, InvitedAt: var at } => Results.Json(new { invitedAt = at }, statusCode: StatusCodes.Status201Created),
                { Status: ResultStatus.Done, InvitedAt: var at } => Results.Ok(new { invitedAt = at }),
                { Status: ResultStatus.Forbidden } => Result.Forbidden.ToHttp(),
                _ => Results.NotFound(),
            });

        // Settings › Learning Bond (L2-136 criterion 9, L2-138, L2-139): admins only, behind the module gate.
        var settings = learningBond.MapGroup(string.Empty).RequirePermission(Permission.ManageSettings);
        settings.MapGet("/settings", (LearningBondSettingsHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapPut("/settings", async (SaveLearningBondSettingsRequest request, LearningBondSettingsHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(request, ct)).ToHttp());
        settings.MapGet("/invitation", (LearningBondInvitationHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapPut("/invitation", async (SaveInvitationRequest request, LearningBondInvitationHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(request, ct)).ToHttp());
        settings.MapGet("/overview", (LearningBondOverviewHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapGet("/launch", (LearningBondLaunchHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapGet("/launch/missing-contacts", (LearningBondLaunchHandler handler, CancellationToken ct) => handler.MissingContactsAsync(ct));
        settings.MapPost("/launch", async (ScheduleLaunchRequest request, LearningBondLaunchHandler handler, CancellationToken ct) =>
            LaunchResult(await handler.ScheduleAsync(request, ct)));
        settings.MapPut("/launch", async (MoveLaunchRequest request, LearningBondLaunchHandler handler, CancellationToken ct) =>
            (await handler.MoveAsync(request, ct)).ToHttp());
        settings.MapDelete("/launch", async (LearningBondLaunchHandler handler, CancellationToken ct) => (await handler.CancelAsync(ct)).ToHttp());

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

    // No mobile number on any covered household answers 422 with code no-phone-numbers (L2-140 criterion 2).
    private static IResult LaunchResult(Result result) =>
        result is { Status: ResultStatus.Invalid, Errors: { } errors } && errors.TryGetValue("launch", out var message) && message == LearningBondLaunchHandler.NoPhoneNumbersMessage
            ? Results.Json(new { code = "no-phone-numbers", errors }, statusCode: StatusCodes.Status422UnprocessableEntity)
            : result.ToHttp("/learning-bond/launch");
}
