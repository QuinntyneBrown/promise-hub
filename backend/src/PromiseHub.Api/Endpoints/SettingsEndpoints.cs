using PromiseHub.Application.Notifications;
using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/settings").RequirePermission(Permission.ManageSettings);
        settings.MapGet("/organization", (GetOrganizationSettingsHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        settings.MapPut("/organization", async (SaveOrganizationCommand command, SetupHandler handler, CancellationToken ct) =>
            (await handler.SaveOrganizationAsync(command, ct)).ToHttp());
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
