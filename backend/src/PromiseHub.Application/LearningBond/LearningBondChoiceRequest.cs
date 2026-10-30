namespace PromiseHub.Application.LearningBond;

/// <summary>The guardian's answer on the landing page (L2-144 criterion 4): "NotNow" or "NotInterested".</summary>
public sealed record LearningBondChoiceRequest(string? Choice);
