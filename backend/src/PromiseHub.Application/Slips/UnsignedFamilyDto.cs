namespace PromiseHub.Application.Slips;

public sealed record UnsignedFamilyDto(Guid HouseholdId, string Household, string? Guardian, IReadOnlyList<string> Children, DateTimeOffset? LastRemindedAt, bool Reachable, string? Reason);
