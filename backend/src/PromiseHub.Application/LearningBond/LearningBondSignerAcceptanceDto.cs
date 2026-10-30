namespace PromiseHub.Application.LearningBond;

/// <summary>What was recorded when the named signer accepted (L2-137 criterion 2), shown back to the signer on the thank-you page.</summary>
public sealed record LearningBondSignerAcceptanceDto(
    string Organization,
    string RequestedBy,
    string Name,
    string Title,
    string Email,
    int Version,
    DateTimeOffset AcceptedAt);
