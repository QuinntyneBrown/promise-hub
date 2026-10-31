namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The language model behind the Learning Bond agent (L2-160, ADR 0085). It may call the tools it is given, through <c>runTool</c>, which
/// the server answers for the link's household; it answers text, or null when it has nothing usable. It never sees a SIN or a contact.
/// </summary>
public interface ILanguageModel
{
    Task<string?> ReplyAsync(LanguageModelRequest request, Func<LanguageModelToolCall, CancellationToken, Task<string>> runTool, CancellationToken cancellationToken);
}
