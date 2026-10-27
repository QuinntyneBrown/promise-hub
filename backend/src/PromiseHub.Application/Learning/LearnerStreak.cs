namespace PromiseHub.Application.Learning;

/// <summary>
/// The weeks in a row, Monday to Sunday in UTC, with at least one lesson completed (L2-087 criterion 2, ADR 0059): counted back from this week,
/// or from last week while this week has none yet.
/// </summary>
public static class LearnerStreak
{
    public static int Weeks(IEnumerable<DateTimeOffset> completedAt, DateTimeOffset now)
    {
        var weeks = completedAt.Select(WeekOf).ToHashSet();
        var week = WeekOf(now);
        if (!weeks.Contains(week))
        {
            week = week.AddDays(-7);
        }
        var streak = 0;
        while (weeks.Contains(week))
        {
            streak++;
            week = week.AddDays(-7);
        }
        return streak;
    }

    /// <summary>The Monday that starts the week holding the moment, in UTC.</summary>
    private static DateOnly WeekOf(DateTimeOffset at)
    {
        var day = DateOnly.FromDateTime(at.UtcDateTime);
        return day.AddDays(-(((int)day.DayOfWeek + 6) % 7));
    }
}
