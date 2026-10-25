namespace PromiseHub.Application.Attendance;

public enum NotCheckedInAction
{
    MarkAbsent,
    LeaveNotRecorded,
}

public enum NotSignedOutAction
{
    SignOutAtEnd,
    LeaveUnsigned,
}

/// <summary>What to do with the children not checked in and those not signed out when the session ends (dialog: end-session).</summary>
public sealed record EndSessionCommand(NotCheckedInAction NotCheckedIn, NotSignedOutAction NotSignedOut);
