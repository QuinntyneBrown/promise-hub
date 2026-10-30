using PromiseHub.Application.LearningBond;

namespace PromiseHub.Infrastructure.LearningBond;

/// <summary>The model until credentials are configured: it answers nothing, so every step keeps its approved fixed line (L2-160 criterion 4).</summary>
public sealed class UnconfiguredLanguageModel : ILanguageModel
{
    public Task<string?> ReplyAsync(LanguageModelRequest request, Func<LanguageModelToolCall, CancellationToken, Task<string>> runTool, CancellationToken cancellationToken) =>
        Task.FromResult<string?>(null);
}
