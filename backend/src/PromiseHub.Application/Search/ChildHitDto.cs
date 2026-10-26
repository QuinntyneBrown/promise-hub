namespace PromiseHub.Application.Search;

public sealed record ChildHitDto(Guid Id, string Name, int? Age, Guid HouseholdId, string HouseholdName);
