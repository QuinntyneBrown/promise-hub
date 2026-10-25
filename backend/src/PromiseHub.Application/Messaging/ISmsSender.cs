namespace PromiseHub.Application.Messaging;

/// <summary>The text provider. The provider is not chosen yet; development logs, tests use a fake.</summary>
public interface ISmsSender
{
    Task<SendResult> SendAsync(string to, string text, CancellationToken cancellationToken);
}
