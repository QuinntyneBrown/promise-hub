namespace PromiseHub.Application.LearningBond;

/// <summary>One turn of the conversation as the model reads it: "user" for the guardian, "assistant" for the agent.</summary>
public sealed record LanguageModelTurn(string Role, string Text);
