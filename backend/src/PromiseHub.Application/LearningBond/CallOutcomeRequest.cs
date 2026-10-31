namespace PromiseHub.Application.LearningBond;

/// <summary>Mark call done (L2-142 criterion 4): "Resumed", "NotInterested" or "NoAnswer".</summary>
public sealed record CallOutcomeRequest(string? Outcome);
