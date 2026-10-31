using System.Collections.Concurrent;
using System.Text.Json;
using PromiseHub.Application.LearningBond;

namespace PromiseHub.Api.Tests;

/// <summary>
/// Stands in for the language model (ILanguageModel): records every request, runs scripted tool calls through the server's tools, and
/// answers a set reply, nothing, slowly, or with an error.
/// </summary>
public sealed class FakeLanguageModel : ILanguageModel
{
    private readonly ConcurrentQueue<LanguageModelRequest> _requests = new();
    private readonly ConcurrentQueue<string> _toolResults = new();

    public IReadOnlyList<LanguageModelRequest> Requests => [.. _requests];

    /// <summary>What the tools answered, in order.</summary>
    public IReadOnlyList<string> ToolResults => [.. _toolResults];

    public string? Reply { get; set; } = "Hola, Carmen. Le explico este paso.";

    public bool Slow { get; set; }

    public bool Fail { get; set; }

    /// <summary>Tool calls the model makes before it replies.</summary>
    public List<LanguageModelToolCall> ToolCalls { get; } = [];

    public async Task<string?> ReplyAsync(LanguageModelRequest request, Func<LanguageModelToolCall, CancellationToken, Task<string>> runTool,
        CancellationToken cancellationToken)
    {
        _requests.Enqueue(request);
        if (Fail)
        {
            throw new HttpRequestException("The model is down.");
        }
        if (Slow)
        {
            await Task.Delay(Timeout.Infinite, cancellationToken);
        }
        foreach (var call in ToolCalls)
        {
            _toolResults.Enqueue(await runTool(call, cancellationToken));
        }
        return Reply;
    }

    /// <summary>Everything that left for the model, as one string, to prove what never did.</summary>
    public string Sent => string.Join('\n', _requests.Select(r => JsonSerializer.Serialize(r)));
}
