namespace PromiseHub.Application.Households;

public sealed record GuardianDto(
    Guid Id,
    string Name,
    string Relationship,
    string? Mobile,
    string? Email,
    string Language,
    bool IsPrimary,
    bool CanPickUp,
    bool CanSign);
