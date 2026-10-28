using System.Text.Json;
using PromiseHub.Api.Authorization;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Infrastructure.Messaging;

namespace PromiseHub.Api.Endpoints;

/// <summary>
/// The event stream (L2-107, ADR 0068): <c>GET /realtime</c> holds a <c>text/event-stream</c> open for the signed-in member in the active
/// organization, writes each event as it is published and a comment every 25 seconds so proxies keep it open.
/// </summary>
public static class RealtimeEndpoints
{
    private static readonly TimeSpan KeepAlive = TimeSpan.FromSeconds(25);

    public static IEndpointRouteBuilder MapRealtimeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/realtime", async (HttpContext http, RealtimeHub hub, ITenantContext tenant) =>
        {
            var ct = http.RequestAborted;
            http.Response.ContentType = "text/event-stream";
            http.Response.Headers.CacheControl = "no-cache";
            http.Response.Headers["X-Accel-Buffering"] = "no";
            using var subscription = hub.Subscribe(tenant.OrganizationId, tenant.MembershipId);
            await http.Response.WriteAsync(": connected\n\n", ct);
            await http.Response.Body.FlushAsync(ct);
            try
            {
                while (!ct.IsCancellationRequested)
                {
                    using var beat = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    beat.CancelAfter(KeepAlive);
                    string frame;
                    try
                    {
                        var next = await subscription.Reader.ReadAsync(beat.Token);
                        var data = next.YouthId is { } youthId ? JsonSerializer.Serialize(new { youthId }) : "{}";
                        frame = $"event: {next.Type}\ndata: {data}\n\n";
                    }
                    catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                    {
                        frame = ": keep-alive\n\n";
                    }
                    await http.Response.WriteAsync(frame, ct);
                    await http.Response.Body.FlushAsync(ct);
                }
            }
            catch (OperationCanceledException)
            {
                // The member closed the page or the connection dropped; the browser reconnects and refetches.
            }
        }).AllowAnyMember();
        return app;
    }
}
