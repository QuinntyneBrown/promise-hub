using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PromiseHub.Infrastructure.Observability;

namespace PromiseHub.Api.Hosting;

/// <summary>Checks the alert conditions every minute. Off when <c>Ops:Alerts</c> is false (the tests check by hand).</summary>
public sealed class OpsAlertHostedService(OpsAlertMonitor monitor, IConfiguration configuration, ILogger<OpsAlertHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue("Ops:Alerts", true))
        {
            return;
        }
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await monitor.CheckAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "The alert check failed; it runs again in a minute");
            }
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
