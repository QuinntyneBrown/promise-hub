namespace PromiseHub.Application.LearningBond;

/// <summary>A child as the agent knows them (L2-160 criterion 1): first name, age, claim status and the rule's estimate. Nothing else.</summary>
public sealed record AgentChild(string FirstName, int? Age, string? Claim, string? Paused, int? Estimate);
