namespace PromiseHub.Application.Attendance;

/// <summary>When a child counts as a no-show: the organization's delay after the session starts (ADR 0022, ADR 0030).</summary>
public static class NoShowRules
{
    /// <summary>The shortest delay any organization may choose; the job looks at sessions past it and each tenant's handler decides.</summary>
    public static readonly TimeSpan MinDelay = TimeSpan.FromMinutes(Domain.Notifications.NotificationSettings.MinNoShowDelayMinutes);

    /// <summary>A guardian's reply counts for alerts sent in the last twelve hours.</summary>
    public static readonly TimeSpan ReplyWindow = TimeSpan.FromHours(12);
}
