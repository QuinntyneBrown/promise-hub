using System.Diagnostics;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Observability;

namespace PromiseHub.Api.Middleware;

/// <summary>
/// The outermost middleware (L2-041): gives every request a correlation id and writes one structured line with the
/// tenant, the route template (never the raw path or query, which can carry a child's name), status and duration. It
/// sits outside <see cref="ExceptionHandlingMiddleware"/>, so a handled fault is logged with the 500 it became.
/// </summary>
public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger, RequestMetrics metrics)
{
    public const string Header = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context, TenantContext tenant)
    {
        var supplied = context.Request.Headers[Header].ToString();
        var correlationId = supplied.Length is > 0 and <= 64 ? supplied : Guid.NewGuid().ToString("N")[..12];
        context.TraceIdentifier = correlationId;
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[Header] = correlationId;
            return Task.CompletedTask;
        });
        var started = Stopwatch.GetTimestamp();
        try
        {
            await next(context);
        }
        finally
        {
            var duration = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            var route = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText ?? "(unmatched)";
            var organizationId = tenant.IsResolved ? tenant.OrganizationId : (Guid?)null;
            var status = context.Response.StatusCode;
            metrics.Record(organizationId, status, duration);
            logger.LogInformation("HTTP {Method} {Route} answered {Status} in {DurationMs} ms for {OrganizationId} ({CorrelationId})",
                context.Request.Method, route, status, Math.Round(duration, 1), organizationId, correlationId);
        }
    }
}
