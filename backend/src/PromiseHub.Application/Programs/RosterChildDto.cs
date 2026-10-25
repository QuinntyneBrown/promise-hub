namespace PromiseHub.Application.Programs;

public sealed record RosterChildDto(Guid Id, Guid HouseholdId, string Name, int? Age, string HouseholdName);
