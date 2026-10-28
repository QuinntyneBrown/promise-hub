namespace PromiseHub.Application.Events;

public sealed record EventDto(
    Guid Id,
    string Name,
    Guid ProgramId,
    string ProgramName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Place,
    bool RequiresSlip,
    bool NoShowAlert,
    string? StaffNotes,
    int RosterSize,
    string SlipStatus,
    string Status,
    DateTimeOffset? CancelledAt,
    string? CancelledBy,
    string? CancellationMessage,
    bool GuardiansTold,
    int? SeriesSize);
