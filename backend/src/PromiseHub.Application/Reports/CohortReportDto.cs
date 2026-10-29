namespace PromiseHub.Application.Reports;

/// <summary>
/// The cohort report of one program (L2-127): enrolment, retention, attendance (null while Roll Call is off or nothing is marked), learning
/// (null while Learning is off), the at-risk count (null while Mentoring is off), the organization-wide comparison and every youth enrolled now or before.
/// </summary>
public sealed record CohortReportDto(
    Guid ProgramId,
    string Name,
    string? TrackName,
    int Enrolled,
    int Ended,
    int? RetentionRate,
    int? AttendanceRate,
    CohortLearningDto? Learning,
    int? AtRisk,
    CohortComparisonDto Comparison,
    IReadOnlyList<CohortYouthDto> Youth);
