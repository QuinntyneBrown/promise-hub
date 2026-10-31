namespace PromiseHub.Application.LearningBond;

/// <summary>What goes to the model (L2-160 criterion 1): the step's fixed system prompt with the agent's context, the conversation so far, the guardian's message, the read-only tools and the household's language.</summary>
public sealed record LanguageModelRequest(string System, IReadOnlyList<LanguageModelTurn> History, string Message, IReadOnlyList<LanguageModelTool> Tools, string Language);
