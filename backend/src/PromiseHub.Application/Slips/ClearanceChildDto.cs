namespace PromiseHub.Application.Slips;

/// <summary>One child on the day: Cleared, Missing or Declined.</summary>
public sealed record ClearanceChildDto(Guid ChildId, Guid HouseholdId, string Name, string Status);
