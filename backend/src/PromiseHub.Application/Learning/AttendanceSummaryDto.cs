namespace PromiseHub.Application.Learning;

/// <summary>Her attendance while Roll Call is on (L2-088 criterion 3): sessions attended of sessions marked, newest first.</summary>
public sealed record AttendanceSummaryDto(int Attended, int Marked, IReadOnlyList<SessionAttendanceDto> Sessions);
