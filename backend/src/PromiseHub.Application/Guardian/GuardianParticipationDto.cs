namespace PromiseHub.Application.Guardian;

/// <summary>A youth's participation consent as the guardian reads it: Given, Withdrawn or Needed, with who signed or withdrew and when (L2-104 criterion 1).</summary>
public sealed record GuardianParticipationDto(string Status, string? SignedBy, string? Relationship, DateTimeOffset? SignedAt, string? Reference,
    DateTimeOffset? WithdrawnAt, string? WithdrawnBy);
