namespace PromiseHub.Application.Guardian;

/// <summary>The guardian consent page (`guardian-consent`, L2-055, L2-058): the child, the wording and what is on record.</summary>
public sealed record GuardianConsentDto(
    string Language,
    string Organization,
    string? Phone,
    string GuardianName,
    GuardianConsentChildDto Child,
    string Wording,
    int ConsentAge,
    string Status,
    string? SignedBy,
    string? Relationship,
    DateTimeOffset? SignedAt,
    string? Reference,
    DateTimeOffset? WithdrawnAt,
    string? WithdrawnBy);
