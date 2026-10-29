using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using PromiseHub.Application.Notifications;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SettingsEndpoints
{
    private const long LogoFormOverhead = 64 * 1024;

    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/settings").RequirePermission(Permission.ManageSettings);
        settings.MapGet("/organization", (GetOrganizationSettingsHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        settings.MapPut("/organization", async (SaveOrganizationCommand command, SetupHandler handler, CancellationToken ct) =>
            (await handler.SaveOrganizationAsync(command, ct)).ToHttp());
        settings.MapGet("/organization/profile", (OrganizationProfileHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapPut("/organization/profile", async (SaveOrganizationProfileRequest request, OrganizationProfileHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(request, ct)).ToHttp());
        settings.MapPost("/organization/logo", async (HttpRequest request, OrganizationLogoHandler handler, CancellationToken ct) =>
        {
            if (!request.HasFormContentType || request.ContentLength > OrganizationLogoHandler.MaxBytes + LogoFormOverhead)
            {
                return OrganizationLogoHandler.Refused().ToHttp();
            }
            IFormCollection form;
            try
            {
                form = await request.ReadFormAsync(new FormOptions { MultipartBodyLengthLimit = OrganizationLogoHandler.MaxBytes + LogoFormOverhead }, ct);
            }
            catch (InvalidDataException)
            {
                return OrganizationLogoHandler.Refused().ToHttp();
            }
            if (form.Files.GetFile("file") is not { } file)
            {
                return OrganizationLogoHandler.Refused().ToHttp();
            }
            await using var stream = file.OpenReadStream();
            var (result, logo) = await handler.UploadAsync(file.FileName, file.Length, stream, ct);
            return logo is not null ? Results.Created("/settings/organization/logo", logo) : result.ToHttp();
        }).DisableAntiforgery().WithMetadata(new RequestSizeLimitAttribute(OrganizationLogoHandler.MaxBytes + LogoFormOverhead));
        settings.MapGet("/organization/logo", async (OrganizationLogoHandler handler, CancellationToken ct) =>
            await handler.OpenAsync(ct) is { } logo ? Results.Stream(logo.Content, logo.ContentType) : Results.NotFound());
        settings.MapDelete("/organization/logo", async (OrganizationLogoHandler handler, CancellationToken ct) => (await handler.RemoveAsync(ct)).ToHttp());
        app.MapGet("/setup", (SetupHandler handler, CancellationToken ct) => handler.GetAsync(ct)).RequirePermission(Permission.ManageSettings);
        settings.MapGet("/data-requests", (DataRequestHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        settings.MapPost("/data-requests/{id:guid}/fulfil", async (Guid id, DataRequestHandler handler, CancellationToken ct) => (await handler.FulfilAsync(id, ct)).ToHttp());
        settings.MapGet("/data-requests/{id:guid}/export", async (Guid id, DataRequestHandler handler, CancellationToken ct) =>
            await handler.ExportFileAsync(id, ct) is { } file ? Results.File(System.Text.Encoding.UTF8.GetBytes(file), "text/csv", "household-data.csv") : Results.NotFound());
        settings.MapGet("/privacy", (PrivacyHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapPut("/privacy", async (SavePrivacyCommand command, PrivacyHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(command, ct)).ToHttp());
        settings.MapGet("/consent", (ConsentPolicyHandler handler, CancellationToken ct) => handler.GetAsync(ct)).RequireModule(ModuleId.Roster);
        settings.MapPut("/consent", async (SaveConsentPolicyCommand command, ConsentPolicyHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(command, ct)).ToHttp()).RequireModule(ModuleId.Roster);
        settings.MapGet("/notifications", (NotificationSettingsHandler handler, CancellationToken ct) => handler.GetAsync(ct));
        settings.MapPut("/notifications", async (SaveNotificationSettingsCommand command, NotificationSettingsHandler handler, CancellationToken ct) =>
            (await handler.SaveAsync(command, ct)).ToHttp());
        settings.MapGet("/modules", (GetModulesHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        settings.MapPut("/modules", async (SaveModulesRequest request, SaveModulesHandler handler, CancellationToken ct) =>
        {
            var on = new HashSet<ModuleId>();
            foreach (var id in request.On)
            {
                if (!Enum.TryParse<ModuleId>(id, out var module))
                {
                    return Results.Json(new { errors = new[] { new ModuleViolation(id, $"{id} is not a module.") } }, statusCode: StatusCodes.Status422UnprocessableEntity);
                }
                on.Add(module);
            }
            var result = await handler.HandleAsync(on, ct);
            return result.Violations.Count > 0
                ? Results.Json(new { errors = result.Violations }, statusCode: StatusCodes.Status422UnprocessableEntity)
                : Results.Ok(new { on = result.On });
        });
        return app;
    }
}
