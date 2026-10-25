namespace PromiseHub.Application.Programs;

public sealed record ProgramEventDto(Guid Id, string Name, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string Status);
