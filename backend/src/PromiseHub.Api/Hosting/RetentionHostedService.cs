using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PromiseHub.Infrastructure.Privacy;

namespace PromiseHub.Api.Hosting;

/// <summary>Runs the retention job once a day. Off when <c>Privacy:Retention</c> is false (the tests run it by hand).</summary>
public sealed class RetentionHostedService(RetentionRunner runner, IConfiguration configuration, ILogger<RetentionHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue("Privacy:Retention", true))
        {
            return;
        }
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await runner.RunOnceAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "The retention job failed; it runs again tomorrow");
            }
            await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
        }
    }
}
