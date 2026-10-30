namespace PromiseHub.Application.LearningBond;

/// <summary>A tool call the model made: the tool's name and its string arguments.</summary>
public sealed record LanguageModelToolCall(string Name, IReadOnlyDictionary<string, string> Arguments);
