namespace PromiseHub.Application.Households;

public sealed record AddGuardianCommand(string Name, string Relationship, string? Mobile, string? Email, string Language, bool CanPickUp, bool CanSign);
