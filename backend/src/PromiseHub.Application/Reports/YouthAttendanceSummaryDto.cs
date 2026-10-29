namespace PromiseHub.Application.Reports;

/// <summary>A child's marked attendance: present, late, excused and absent, and attended of marked as a whole percent.</summary>
public sealed record YouthAttendanceSummaryDto(int Present, int Late, int Excused, int Absent, int? Rate);
