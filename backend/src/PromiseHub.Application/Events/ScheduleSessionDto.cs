namespace PromiseHub.Application.Events;

/// <summary>A session on a youth's schedule with her answer and note, if any (L2-094 criterion 1).</summary>
public sealed record ScheduleSessionDto(Guid EventId, string Name, string ProgramName, DateOnly Day, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Place, string Status,
    string? Response, string? Note);
