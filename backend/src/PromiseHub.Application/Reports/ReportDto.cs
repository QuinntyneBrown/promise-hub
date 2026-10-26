namespace PromiseHub.Application.Reports;

/// <summary>
/// The report for a program and period (L2-024). Age counts are strings so a count under five can read "&lt;5" when
/// <see cref="Masked"/> is true.
/// </summary>
public sealed record ReportDto(
    int ChildrenServed,
    int AttendanceRate,
    int SessionsDelivered,
    int SlipsSigned,
    IReadOnlyList<AgeBandDto> Ages,
    IReadOnlyList<ProgramAttendanceDto> Programs,
    IReadOnlyList<LanguageCountDto> Languages,
    bool Masked);
