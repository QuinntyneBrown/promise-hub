namespace PromiseHub.Application.Guardian;

/// <summary>The Guardian consent card on the child record (L2-058 criterion 3): whether consent is required and what is on record.</summary>
public sealed record ChildConsentDto(
    bool Required,
    int ConsentAge,
    string Status,
    string? SignedBy,
    string? Relationship,
    DateTimeOffset? SignedAt,
    string? Reference,
    DateTimeOffset? WithdrawnAt,
    string? WithdrawnBy,
    DateTimeOffset? LinkSentAt);
