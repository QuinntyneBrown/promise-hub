namespace PromiseHub.Application.Slips;

/// <summary>A guardian at the door types their name on the staff device for their family's unsigned children.</summary>
public sealed record SignOnTabletCommand(Guid HouseholdId, string? Name, bool? Photos, string? Lunch);
