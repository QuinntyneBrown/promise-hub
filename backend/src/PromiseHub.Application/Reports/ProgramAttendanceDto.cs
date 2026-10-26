namespace PromiseHub.Application.Reports;

/// <summary>A program's attendance rate; null before any attendance is recorded.</summary>
public sealed record ProgramAttendanceDto(Guid Id, string Name, int? AttendanceRate);
