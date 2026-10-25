namespace PromiseHub.Application.Events;

public sealed record EventSummaryDto(Guid Id, string Name, Guid ProgramId, string ProgramName, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Place, int RosterSize, string SlipStatus, string Status);
