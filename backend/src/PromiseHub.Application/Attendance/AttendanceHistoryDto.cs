namespace PromiseHub.Application.Attendance;

/// <summary>A cohort's attendance history (L2-097, ADR 0065).</summary>
public sealed record AttendanceHistoryDto(
    IReadOnlyList<CohortOptionDto> Cohorts,
    Guid? ProgramId,
    string? ProgramName,
    string? Schedule,
    int? Rate,
    int SessionsRecorded,
    int SessionsHeld,
    int BelowThreshold,
    bool CanCorrect,
    IReadOnlyList<SessionAttendanceDto> Sessions,
    IReadOnlyList<YouthAttendanceDto> Youth);
