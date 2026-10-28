using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Events;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// A person's own schedule (L2-101, ADR 0066): the sessions they are staffed onto that have not ended and start within the next
/// 28 days, soonest first, with the program, the organization's calendar day, the roster size, the event's status and whether it is
/// today. It starts from the caller's membership, never from a client id; the tenant filter keeps it in the organization.
/// </summary>
public sealed class MyScheduleHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, SessionReader reader)
{
    public static readonly TimeSpan Window = TimeSpan.FromDays(28);

    public async Task<MyScheduleDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var me = tenant.MembershipId;
        var assigned = await db.SessionStaff.AsNoTracking().Where(s => s.MembershipId == me).Select(s => s.EventId).ToListAsync(cancellationToken);
        var now = clock.GetUtcNow();
        var events = (await db.Events.AsNoTracking().Where(e => assigned.Contains(e.Id)).ToListAsync(cancellationToken))
            .Where(e => e.EndsAt > now && e.StartsAt <= now + Window)
            .OrderBy(e => e.StartsAt)
            .ThenBy(e => e.Name, StringComparer.Ordinal)
            .ToList();
        var programIds = events.Select(e => e.ProgramId).Distinct().ToList();
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var zone = await EventRules.ZoneAsync(db, tenant.OrganizationId, cancellationToken);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).DateTime);
        var sessions = new List<MySessionDto>();
        foreach (var e in events)
        {
            var day = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(e.StartsAt, zone).DateTime);
            var summary = await reader.SummaryAsync(e, cancellationToken);
            sessions.Add(new MySessionDto(e.Id, e.Name, programs[e.ProgramId], day, e.StartsAt, e.EndsAt, e.Place, summary.Expected, e.Status.ToString(), day == today));
        }
        return new MyScheduleDto(sessions);
    }
}
