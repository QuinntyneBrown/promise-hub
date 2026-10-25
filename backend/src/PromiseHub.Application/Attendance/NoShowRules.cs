namespace PromiseHub.Application.Attendance;

/// <summary>When a child counts as a no-show: the delay after the session starts (ADR 0022).</summary>
public static class NoShowRules
{
    public static readonly TimeSpan Delay = TimeSpan.FromMinutes(15);

    /// <summary>A guardian's reply counts for alerts sent in the last twelve hours.</summary>
    public static readonly TimeSpan ReplyWindow = TimeSpan.FromHours(12);
}
