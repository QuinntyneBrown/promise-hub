namespace PromiseHub.Domain.Events;

/// <summary>
/// The starts of a weekly series (L2-093, ADR 0064): every week from the first start, at the same wall-clock time in the organization's time
/// zone, while the local date is on or before the program's last day.
/// </summary>
public static class WeeklySeries
{
    public const int MaximumSessions = 60;

    /// <summary>The starts, stopping one past <see cref="MaximumSessions"/> so a caller can tell the series is too long.</summary>
    public static IReadOnlyList<DateTimeOffset> Starts(DateTimeOffset first, DateOnly lastDay, TimeZoneInfo zone)
    {
        var local = TimeZoneInfo.ConvertTime(first, zone).DateTime;
        var starts = new List<DateTimeOffset>();
        for (var week = local; DateOnly.FromDateTime(week) <= lastDay && starts.Count <= MaximumSessions; week = week.AddDays(7))
        {
            var wall = DateTime.SpecifyKind(week, DateTimeKind.Unspecified);
            starts.Add(new DateTimeOffset(wall, zone.GetUtcOffset(wall)));
        }
        return starts;
    }
}
