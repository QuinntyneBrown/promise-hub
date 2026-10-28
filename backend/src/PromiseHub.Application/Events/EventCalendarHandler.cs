using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Events;

/// <summary>
/// The calendar (L2-093 criterion 3, ADR 0064): the events whose start falls in a month by the organization's calendar day, optionally of one
/// program; with no month, the organization's current month. Null when the month is not a yyyy-MM month.
/// </summary>
public sealed class EventCalendarHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task<EventCalendarDto?> HandleAsync(string? month, Guid? programId, CancellationToken cancellationToken = default)
    {
        var zone = await EventRules.ZoneAsync(db, tenant.OrganizationId, cancellationToken);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone).DateTime);
        DateOnly first;
        if (string.IsNullOrWhiteSpace(month))
        {
            first = new DateOnly(today.Year, today.Month, 1);
        }
        else if (!DateOnly.TryParseExact($"{month.Trim()}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out first))
        {
            return null;
        }
        var programs = await db.Programs.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        // A day either side covers every time zone; the local day decides.
        var from = new DateTimeOffset(first.AddDays(-1).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var to = new DateTimeOffset(first.AddMonths(1).AddDays(1).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var events = (await db.Events.AsNoTracking().Where(e => programId == null || e.ProgramId == programId).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt >= from && e.StartsAt < to)
            .Select(e => new CalendarEventDto(e.Id, e.Name, e.ProgramId, programs.GetValueOrDefault(e.ProgramId, ""),
                DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(e.StartsAt, zone).DateTime), e.StartsAt, e.EndsAt, e.Place, e.Status.ToString()))
            .Where(e => e.Day.Year == first.Year && e.Day.Month == first.Month)
            .OrderBy(e => e.StartsAt)
            .ThenBy(e => e.Name, StringComparer.Ordinal)
            .ToList();
        return new EventCalendarDto(first.ToString("yyyy-MM", CultureInfo.InvariantCulture), today, events);
    }
}
