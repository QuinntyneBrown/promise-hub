using PromiseHub.Api.Authorization;
using PromiseHub.Application.Notifications;

namespace PromiseHub.Api.Endpoints;

/// <summary>The signed-in person's in-app notifications. Not a module; each notice follows its own module.</summary>
public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/notifications").AllowAnyMember();
        group.MapGet(string.Empty, (NotificationsHandler handler, CancellationToken ct) => handler.ListAsync(ct));
        group.MapPost("/read-all", async (NotificationsHandler handler, CancellationToken ct) => (await handler.ReadAllAsync(ct)).ToHttp());
        group.MapPost("/{id:guid}/read", async (Guid id, NotificationsHandler handler, CancellationToken ct) => (await handler.ReadAsync(id, ct)).ToHttp());
        return app;
    }
}
