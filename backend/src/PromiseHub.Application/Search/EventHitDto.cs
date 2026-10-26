namespace PromiseHub.Application.Search;

public sealed record EventHitDto(Guid Id, string Name, DateTimeOffset StartsAt, string? Place);
