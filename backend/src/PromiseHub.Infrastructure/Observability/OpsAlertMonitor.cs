using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PromiseHub.Domain.Messaging;
using PromiseHub.Infrastructure.Persistence;

namespace PromiseHub.Infrastructure.Observability;

/// <summary>
/// Checked every minute (L2-041): raises an alert when more than 1% of requests in the last five minutes failed (with at
/// least 20 requests to judge by), and when a tenant has a delivery queued for more than ten minutes. An alert is raised
/// once when its condition starts and again only after it has cleared.
/// </summary>
public sealed class OpsAlertMonitor(RequestMetrics metrics, IServiceScopeFactory scopes, IAlertSender alerts, TimeProvider clock)
{
    public const double ErrorRateThreshold = 0.01;
    public const int MinimumRequests = 20;
    public static readonly TimeSpan QueueAgeThreshold = TimeSpan.FromMinutes(10);

    private readonly HashSet<string> _active = [];

    public async Task CheckAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var raised = new HashSet<string>();

        var (requests, errors, _) = metrics.Summary();
        if (requests >= MinimumRequests && (double)errors / requests > ErrorRateThreshold)
        {
            raised.Add("error-rate");
            if (!_active.Contains("error-rate"))
            {
                await alerts.RaiseAsync(new Alert("error-rate", null, $"{errors} of {requests} requests failed in the last 5 minutes", now), cancellationToken);
            }
        }

        using (var scope = scopes.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseHubDbContext>();
            var queued = await db.Deliveries.IgnoreQueryFilters().AsNoTracking()
                .Where(d => d.Status == DeliveryStatus.Queued)
                .Select(d => new { d.OrganizationId, d.DueAt }).ToListAsync(cancellationToken);
            foreach (var tenant in queued.Where(d => d.DueAt < now - QueueAgeThreshold).GroupBy(d => d.OrganizationId))
            {
                var key = $"queue-age:{tenant.Key}";
                raised.Add(key);
                if (!_active.Contains(key))
                {
                    var minutes = (int)(now - tenant.Min(d => d.DueAt)).TotalMinutes;
                    await alerts.RaiseAsync(new Alert("queue-age", tenant.Key, $"{tenant.Count()} deliveries waiting, oldest {minutes} minutes", now), cancellationToken);
                }
            }
        }

        _active.Clear();
        _active.UnionWith(raised);
    }
}
