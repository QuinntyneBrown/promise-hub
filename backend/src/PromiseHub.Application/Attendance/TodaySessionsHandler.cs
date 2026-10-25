using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Attendance;

/// <summary>Today's scheduled sessions in the organization's time zone, with their counts; a youth worker's assigned ones only.</summary>
public sealed class TodaySessionsHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, SessionReader reader, SessionAccess access)
{
    public async Task<TodaySessionsDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        var local = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone);
        var dayStart = new DateTimeOffset(local.Date, zone.GetUtcOffset(local.Date));
        var dayEnd = dayStart.AddDays(1);
        var assigned = await access.AssignedAsync(cancellationToken);
        var events = (await db.Events.AsNoTracking().Where(e => e.Status == EventStatus.Scheduled).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt < dayEnd && e.EndsAt > dayStart)
            .Where(e => assigned is null || assigned.Contains(e.Id))
            .OrderBy(e => e.StartsAt)
            .ToList();
        var sessions = new List<SessionSummaryDto>();
        foreach (var e in events)
        {
            sessions.Add(await reader.SummaryAsync(e, cancellationToken));
        }
        return new TodaySessionsDto(sessions);
    }
}
