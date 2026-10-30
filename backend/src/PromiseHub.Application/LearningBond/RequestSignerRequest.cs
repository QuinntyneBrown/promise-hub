namespace PromiseHub.Application.LearningBond;

/// <summary>Name the person who accepts the agreement (L2-137 criterion 1).</summary>
public sealed record RequestSignerRequest(string? Name, string? Title, string? Email);
