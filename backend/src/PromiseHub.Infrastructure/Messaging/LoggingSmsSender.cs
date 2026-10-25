using Microsoft.Extensions.Logging;
using PromiseHub.Application.Messaging;

namespace PromiseHub.Infrastructure.Messaging;

/// <summary>Stands in for the text provider until one is chosen: logs that a text would go out, never its content.</summary>
public sealed class LoggingSmsSender(ILogger<LoggingSmsSender> logger) : ISmsSender
{
    public Task<SendResult> SendAsync(string to, string text, CancellationToken cancellationToken)
    {
        logger.LogInformation("Text of {Length} characters accepted for delivery", text.Length);
        return Task.FromResult(SendResult.Accepted);
    }
}
