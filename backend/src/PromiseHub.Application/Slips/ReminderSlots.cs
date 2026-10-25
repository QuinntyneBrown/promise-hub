using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>When reminders fall: 6 pm in the organization's time zone, on the slip's schedule, from the send to the sign-by date.</summary>
public static class ReminderSlots
{
    private static readonly TimeOnly At = new(18, 0);

    /// <summary>The latest slot that has come, or null when none has.</summary>
    public static DateTimeOffset? Due(PermissionSlip slip, TimeZoneInfo zone, DateTimeOffset now)
    {
        if (slip.Status != SlipStatus.Sent || slip.SentAt is not { } sentAt || slip.Reminders == SlipReminders.None)
        {
            return null;
        }
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).DateTime);
        var last = today < slip.SignBy ? today : slip.SignBy;
        for (var day = last; day >= DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(sentAt, zone).DateTime); day = day.AddDays(-1))
        {
            if (!Falls(slip, day))
            {
                continue;
            }
            var local = day.ToDateTime(At);
            var slot = new DateTimeOffset(local, zone.GetUtcOffset(local));
            if (slot <= now && slot > sentAt)
            {
                return slot;
            }
        }
        return null;
    }

    private static bool Falls(PermissionSlip slip, DateOnly day) => slip.Reminders switch
    {
        SlipReminders.TwiceWeekly => day.DayOfWeek is DayOfWeek.Tuesday or DayOfWeek.Thursday,
        SlipReminders.Daily => true,
        SlipReminders.Once => day == slip.SignBy.AddDays(-2),
        _ => false,
    };

    public static string Key(DateTimeOffset slot, TimeZoneInfo zone) =>
        TimeZoneInfo.ConvertTime(slot, zone).ToString("yyyy-MM-dd'T'HH:mm", System.Globalization.CultureInfo.InvariantCulture);
}
