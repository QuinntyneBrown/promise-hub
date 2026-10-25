using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Composing, sending and tracking guardian messages, and the SMS cap: the Messages module.</summary>
public static class MessagingEndpoints
{
    public static IEndpointRouteBuilder MapMessagingEndpoints(this IEndpointRouteBuilder app)
    {
        var messages = app.MapGroup("/messages").RequireModule(ModuleId.Messages).RequirePermission(Permission.SendMessages);
        messages.MapGet("/", (ListMessagesHandler handler, CancellationToken ct) => handler.HandleAsync(ct));
        messages.MapPost("/preview", (AudienceRequest request, PreviewMessageHandler handler, CancellationToken ct) => handler.HandleAsync(request, ct));
        messages.MapPost("/", async (AudienceRequest request, SendMessageHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(request, ct)).ToHttp("/messages"));
        messages.MapGet("/{id:guid}", async (Guid id, GetMessageHandler handler, CancellationToken ct) =>
            await handler.HandleAsync(id, ct) is { } message ? Results.Ok(message) : Results.NotFound());
        app.MapGet("/messaging/sms-cap", (GetSmsCapHandler handler, CancellationToken ct) => handler.HandleAsync(ct))
            .RequireModule(ModuleId.Messages).RequirePermission(Permission.SendMessages);
        return app;
    }
}
