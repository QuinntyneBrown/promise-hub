namespace PromiseHub.Application.Messaging;

/// <summary>The email provider. The provider is not chosen yet; development logs, tests use a fake.</summary>
public interface IEmailSender
{
    Task<SendResult> SendAsync(string to, string subject, string body, CancellationToken cancellationToken);
}
