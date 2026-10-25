namespace PromiseHub.Application.Attendance;

public sealed record TodaySessionsDto(IReadOnlyList<SessionSummaryDto> Sessions);
