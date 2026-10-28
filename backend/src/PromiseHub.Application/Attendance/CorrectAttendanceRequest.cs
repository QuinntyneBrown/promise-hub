namespace PromiseHub.Application.Attendance;

/// <summary>A correction: the mark (Present, Late, Excused or Absent) and why (L2-097).</summary>
public sealed record CorrectAttendanceRequest(string? Status, string? Reason);
