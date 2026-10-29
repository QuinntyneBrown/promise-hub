namespace PromiseHub.Application.Reports;

/// <summary>The staff activity report (L2-128): totals across active mentors and a row per mentor; reviews are null while Learning is off.</summary>
public sealed record StaffReportDto(int ActiveMentors, int CheckIns, int? Reviews, double AverageCaseload, IReadOnlyList<MentorActivityRowDto> Mentors);
