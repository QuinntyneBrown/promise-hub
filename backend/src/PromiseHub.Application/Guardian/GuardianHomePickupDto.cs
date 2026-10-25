namespace PromiseHub.Application.Guardian;

/// <summary>An adult besides the guardians who may collect the child, as the family page lists them.</summary>
public sealed record GuardianHomePickupDto(Guid Id, string Name, string Relationship);
