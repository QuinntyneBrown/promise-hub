namespace PromiseHub.Application.LearningBond;

/// <summary>Who accepted which version of the agreement for the organization, and when (L2-136 criterion 2).</summary>
public sealed record LearningBondAcceptanceDto(int Version, string AcceptedBy, DateTimeOffset AcceptedAt);
