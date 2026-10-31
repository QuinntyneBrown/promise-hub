namespace PromiseHub.Application.LearningBond;

/// <summary>The open request for a named signer (L2-137): who was asked and when, and the email they received; never the token.</summary>
public sealed record LearningBondSignerRequestDto(Guid Id, string Name, string Title, string Email, DateTimeOffset SentAt, DateTimeOffset ExpiresAt,
    LearningBondSignerEmailDto Preview);
