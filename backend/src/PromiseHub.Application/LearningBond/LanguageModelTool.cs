namespace PromiseHub.Application.LearningBond;

/// <summary>A read-only tool the model may call, with its string parameters by name and what each means.</summary>
public sealed record LanguageModelTool(string Name, string Description, IReadOnlyDictionary<string, string> Parameters);
