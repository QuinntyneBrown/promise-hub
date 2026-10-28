namespace PromiseHub.Application.Attendance;

/// <summary>One session on a person's own schedule (L2-101): when and where, the roster size, the event's status and whether it is today.</summary>
public sealed record MySessionDto(
    Guid Id,
    string Name,
    string ProgramName,
    DateOnly Day,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Place,
    int Expected,
    string Status,
    bool Today);
