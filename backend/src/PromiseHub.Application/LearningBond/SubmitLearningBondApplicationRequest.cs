namespace PromiseHub.Application.LearningBond;

/// <summary>Submit to {provider} (L2-149 criterion 2): the review version the guardian looked at.</summary>
public sealed record SubmitLearningBondApplicationRequest(int? ReviewVersion);
