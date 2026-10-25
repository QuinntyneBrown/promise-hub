using System.Collections.Concurrent;
using PromiseHub.Application.Messaging;

namespace PromiseHub.Api.Tests;

/// <summary>Records emails instead of sending them.</summary>
public sealed class FakeEmailSender : IEmailSender
{
    private readonly ConcurrentQueue<(string To, string Subject)> _sent = new();

    public IReadOnlyList<(string To, string Subject)> Sent => [.. _sent];

    public Task<SendResult> SendAsync(string to, string subject, string body, CancellationToken cancellationToken)
    {
        _sent.Enqueue((to, subject));
        return Task.FromResult(SendResult.Accepted);
    }
}
