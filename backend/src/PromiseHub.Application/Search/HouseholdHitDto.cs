namespace PromiseHub.Application.Search;

public sealed record HouseholdHitDto(Guid Id, string Name, string Guardians, string? Phone, string Language);
