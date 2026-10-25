namespace PromiseHub.Application.Guardian;

public sealed record GuardianSlipEventDto(string Name, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Place);
