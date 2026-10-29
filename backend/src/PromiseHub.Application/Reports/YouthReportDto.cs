namespace PromiseHub.Application.Reports;

/// <summary>
/// One child's report (L2-127 criterion 3): learning (null while Learning is off or without a youth account), attendance (null while Roll Call
/// is off) and mentoring (null while Mentoring is off).
/// </summary>
public sealed record YouthReportDto(
    Guid ChildId,
    string Name,
    int? Age,
    IReadOnlyList<string> Programs,
    bool HasAccount,
    YouthLearningDto? Learning,
    YouthAttendanceSummaryDto? Attendance,
    YouthMentoringDto? Mentoring);
