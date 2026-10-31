namespace PromiseHub.Application.LearningBond;

/// <summary>The step the guardian is on and, optionally, what they typed to the agent (L2-160).</summary>
public sealed record AskLearningBondAgentRequest(string? Step, string? Message);
