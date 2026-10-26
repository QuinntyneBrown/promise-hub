using System.Collections.Concurrent;
using PromiseHub.Infrastructure.Observability;

namespace PromiseHub.Api.Tests;

/// <summary>Keeps the alerts raised instead of paging anyone.</summary>
public sealed class FakeAlertSender : IAlertSender
{
    public ConcurrentQueue<Alert> Raised { get; } = new();

    public Task RaiseAsync(Alert alert, CancellationToken cancellationToken = default)
    {
        Raised.Enqueue(alert);
        return Task.CompletedTask;
    }
}
