namespace PromiseHub.Application.Attendance;

public sealed record SessionRosterDto(SessionSummaryDto Session, IReadOnlyList<RosterEntryDto> Children);
