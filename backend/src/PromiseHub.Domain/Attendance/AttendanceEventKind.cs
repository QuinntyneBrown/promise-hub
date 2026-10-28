namespace PromiseHub.Domain.Attendance;

public enum AttendanceEventKind
{
    CheckedIn,
    MarkedAbsent,
    SignedOut,
    CheckedInLate,
    MarkedExcused,
    Corrected,
}
