using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Attendance;

/// <summary>How a record counts in the history: the four marks read from Roll Call's check-in model (ADR 0065).</summary>
public static class AttendanceMarks
{
    public static AttendanceMark? Of(AttendanceRecord record) => record.Status switch
    {
        AttendanceStatus.Present or AttendanceStatus.SignedOut => record.Late ? AttendanceMark.Late : AttendanceMark.Present,
        AttendanceStatus.Absent => record.Excused ? AttendanceMark.Excused : AttendanceMark.Absent,
        _ => null,
    };

    public static bool Attended(AttendanceMark mark) => mark is AttendanceMark.Present or AttendanceMark.Late;

    /// <summary>Attended of marked as a whole percent; null when nothing is marked.</summary>
    public static int? Rate(int attended, int marked) => marked == 0 ? null : (int)Math.Round(100.0 * attended / marked, MidpointRounding.AwayFromZero);
}
