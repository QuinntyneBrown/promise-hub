namespace PromiseHub.Application.Organizations;

public sealed record DataRequestDto(Guid Id, string Household, string Kind, string Email, DateTimeOffset RequestedAt, string Status, string? FulfilledBy);
