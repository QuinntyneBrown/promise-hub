namespace PromiseHub.Application.Slips;

/// <summary>A household with children still to sign a slip, whether it can be reached, and why not.</summary>
public sealed record SlipFamily(
    Guid HouseholdId,
    string Household,
    string? Guardian,
    IReadOnlyList<(Guid Id, string FirstName)> Children,
    bool Reachable,
    string? Reason);
