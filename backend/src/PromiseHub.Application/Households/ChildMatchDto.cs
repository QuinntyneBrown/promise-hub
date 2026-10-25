namespace PromiseHub.Application.Households;

public sealed record ChildMatchDto(Guid Id, string Name, int? Age, Guid HouseholdId, string HouseholdName);
