using System.Text;
using PromiseHub.Api.Authorization;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Identity;

namespace PromiseHub.Api.Endpoints;

/// <summary>The audit log, for admins. Not a module; every organization keeps one.</summary>
public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var audit = app.MapGroup("/audit").RequirePermission(Permission.ViewAudit);
        audit.MapGet(string.Empty, (string? q, string? action, int? days, int? page, AuditLogHandler handler, CancellationToken ct) =>
            handler.SearchAsync(new AuditLogQuery(q, action, days, page), ct));
        audit.MapGet("/export", async (string? q, string? action, int? days, AuditLogHandler handler, CancellationToken ct) =>
            Results.File(Encoding.UTF8.GetBytes(await handler.ExportAsync(new AuditLogQuery(q, action, days, null), ct)), "text/csv", "audit-log.csv"));
        return app;
    }
}
