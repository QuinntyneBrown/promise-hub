using System.Collections.Concurrent;
using PromiseHub.Application.Messaging;

namespace PromiseHub.Api.Tests;

/// <summary>Records texts instead of sending them; refuses numbers named by <see cref="FailFor"/>.</summary>
public sealed class FakeSmsSender : ISmsSender
{
    private readonly ConcurrentDictionary<string, bool> _failing = new();
    private readonly ConcurrentQueue<(string To, string Text)> _sent = new();

    public IReadOnlyList<(string To, string Text)> Sent => [.. _sent];

    public void FailFor(string to) => _failing[to] = true;

    public Task<SendResult> SendAsync(string to, string text, CancellationToken cancellationToken)
    {
        if (_failing.ContainsKey(to))
        {
            return Task.FromResult(SendResult.Refused);
        }
        _sent.Enqueue((to, text));
        return Task.FromResult(SendResult.Accepted);
    }
}
