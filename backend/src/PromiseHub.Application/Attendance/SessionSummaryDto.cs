namespace PromiseHub.Application.Attendance;

public sealed record SessionSummaryDto(
    Guid Id,
    string Name,
    Guid ProgramId,
    string ProgramName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Place,
    int Expected,
    int CheckedIn,
    int Absent,
    int NotYet,
    string Status,
    DateTimeOffset? EndedAt = null,
    string? EndedBy = null,
    string? Notes = null,
    int Late = 0,
    int Excused = 0);
