namespace PromiseHub.Application.LearningBond;

/// <summary>The guardian pauses the claim (L2-151 criterion 1): only "NeedsSin", for a child who doesn't have a SIN yet.</summary>
public sealed record PauseLearningBondClaimRequest(string? Reason);
