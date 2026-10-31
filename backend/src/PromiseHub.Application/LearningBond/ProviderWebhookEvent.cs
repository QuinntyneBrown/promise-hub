namespace PromiseHub.Application.LearningBond;

/// <summary>A provider's report on an application (L2-150 criterion 2): Received, Deposited with an amount, or DocumentNeeded with its name.</summary>
public sealed record ProviderWebhookEvent(string? EventId, string? Reference, string? Kind, int? Amount, string? DocumentName);
