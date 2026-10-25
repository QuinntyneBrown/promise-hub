namespace PromiseHub.Application.Programs;

public sealed record ProgramDto(
    Guid Id,
    string Name,
    DateOnly StartsOn,
    DateOnly EndsOn,
    string? Schedule,
    int Capacity,
    string? Ages,
    bool EnrollmentOpen,
    bool SeasonConsent,
    string Status,
    int Enrolled,
    IReadOnlyList<RosterChildDto> Roster,
    IReadOnlyList<ProgramEventDto> Events,
    DateTimeOffset? ArchivedAt,
    string? ArchivedBy);
