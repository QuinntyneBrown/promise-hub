using Microsoft.Extensions.Logging;
using PromiseHub.Application.Messaging;

namespace PromiseHub.Infrastructure.Messaging;

/// <summary>Stands in for the email provider until one is chosen: logs that an email would go out, never its content.</summary>
public sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task<SendResult> SendAsync(string to, string subject, string body, CancellationToken cancellationToken)
    {
        logger.LogInformation("Email of {Length} characters accepted for delivery", body.Length);
        return Task.FromResult(SendResult.Accepted);
    }
}
