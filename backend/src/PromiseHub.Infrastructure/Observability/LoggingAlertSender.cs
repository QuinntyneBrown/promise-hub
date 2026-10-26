using Microsoft.Extensions.Logging;

namespace PromiseHub.Infrastructure.Observability;

/// <summary>
/// The default alert channel: a critical, structured log line that the log platform routes to on-call. A paging
/// provider can replace it behind <see cref="IAlertSender"/>.
/// </summary>
public sealed class LoggingAlertSender(ILogger<LoggingAlertSender> logger) : IAlertSender
{
    public Task RaiseAsync(Alert alert, CancellationToken cancellationToken = default)
    {
        logger.LogCritical("ALERT {AlertKind} for {OrganizationId}: {AlertSummary}", alert.Kind, alert.OrganizationId, alert.Summary);
        return Task.CompletedTask;
    }
}
