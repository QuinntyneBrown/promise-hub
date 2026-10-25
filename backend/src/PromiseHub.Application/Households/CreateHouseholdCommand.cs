namespace PromiseHub.Application.Households;

public sealed record CreateHouseholdCommand(string GuardianName, string? Mobile, string? Email, string Language);
