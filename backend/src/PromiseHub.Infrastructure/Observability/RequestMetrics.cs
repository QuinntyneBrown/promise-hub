using System.Collections.Concurrent;

namespace PromiseHub.Infrastructure.Observability;

/// <summary>
/// Counts requests per tenant in memory for the last few minutes (L2-041): status and duration, so the alert monitor can
/// read the error rate and the 95th percentile latency. Older samples are dropped as new ones arrive.
/// </summary>
public sealed class RequestMetrics(TimeProvider clock)
{
    public static readonly TimeSpan Window = TimeSpan.FromMinutes(5);

    private readonly ConcurrentQueue<(DateTimeOffset At, Guid? OrganizationId, int Status, double DurationMs)> _samples = new();

    public void Record(Guid? organizationId, int status, double durationMs)
    {
        var now = clock.GetUtcNow();
        _samples.Enqueue((now, organizationId, status, durationMs));
        while (_samples.TryPeek(out var oldest) && oldest.At < now - Window)
        {
            _samples.TryDequeue(out _);
        }
    }

    /// <summary>Requests in the window, how many were server errors, and the 95th percentile duration.</summary>
    public (int Requests, int Errors, double P95Ms) Summary(Guid? organizationId = null)
    {
        var since = clock.GetUtcNow() - Window;
        var samples = _samples.Where(s => s.At >= since && (organizationId is null || s.OrganizationId == organizationId)).ToList();
        if (samples.Count == 0)
        {
            return (0, 0, 0);
        }
        var durations = samples.Select(s => s.DurationMs).Order().ToList();
        var p95 = durations[(int)Math.Ceiling(durations.Count * 0.95) - 1];
        return (samples.Count, samples.Count(s => s.Status >= 500), p95);
    }
}
