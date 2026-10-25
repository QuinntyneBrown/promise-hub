using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using PromiseHub.Infrastructure.Messaging;

namespace PromiseHub.Api.Hosting;

/// <summary>Runs the send job every few seconds. Off when <c>Messaging:Dispatch</c> is false (the tests run it by hand).</summary>
public sealed class MessageDispatchHostedService(MessageDispatchRunner runner, IConfiguration configuration, ILogger<MessageDispatchHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue("Messaging:Dispatch", true))
        {
            return;
        }
        var interval = TimeSpan.FromSeconds(configuration.GetValue("Messaging:DispatchSeconds", 15));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await runner.RunOnceAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "The message send job failed; it runs again shortly");
            }
            await Task.Delay(interval, stoppingToken);
        }
    }
}
