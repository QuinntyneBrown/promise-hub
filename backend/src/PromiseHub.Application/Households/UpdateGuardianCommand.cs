namespace PromiseHub.Application.Households;

public sealed record UpdateGuardianCommand(string Name, string Relationship, string? Mobile, bool CanPickUp, bool CanSign);
