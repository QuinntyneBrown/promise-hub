using PromiseHub.Api.Authorization;
using PromiseHub.Api.Modules;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Api.Endpoints;

/// <summary>Announcements (L2-105, ADR 0068): the Messages module; staff with Send messages compose and track them.</summary>
public static class AnnouncementEndpoints
{
    public static IEndpointRouteBuilder MapAnnouncementEndpoints(this IEndpointRouteBuilder app)
    {
        var staff = app.MapGroup("/announcements").RequireModule(ModuleId.Messages);
        staff.MapGet("/", (ListAnnouncementsHandler handler, CancellationToken ct) => handler.HandleAsync(ct)).RequirePermission(Permission.SendMessages);
        staff.MapPost("/", async (ComposeAnnouncementRequest request, ComposeAnnouncementHandler handler, CancellationToken ct) =>
            (await handler.HandleAsync(request, ct)).ToHttp("/announcements")).RequirePermission(Permission.SendMessages);
        return app;
    }
}
