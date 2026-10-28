using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Events;

/// <summary>
/// A youth's schedule (L2-094 criterion 1): the events of the active programs her child is enrolled in that have not started and start
/// within the next 28 days, soonest first, with the organization's calendar day and her answer and note.
/// </summary>
public sealed class YouthScheduleHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public static readonly TimeSpan Window = TimeSpan.FromDays(28);

    public async Task<YouthScheduleDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        if (await YouthEvents.ChildAsync(db, tenant, cancellationToken) is not { } childId)
        {
            return new YouthScheduleDto([]);
        }
        var programIds = await YouthEvents.ProgramIdsAsync(db, childId, cancellationToken);
        var programs = await db.Programs.AsNoTracking().Where(p => programIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var now = clock.GetUtcNow();
        var until = now + Window;
        var zone = await EventRules.ZoneAsync(db, tenant.OrganizationId, cancellationToken);
        var events = (await db.Events.AsNoTracking().Where(e => programIds.Contains(e.ProgramId)).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt > now && e.StartsAt <= until)
            .OrderBy(e => e.StartsAt)
            .ThenBy(e => e.Name, StringComparer.Ordinal)
            .ToList();
        var eventIds = events.Select(e => e.Id).ToList();
        var answers = await db.EventRsvps.AsNoTracking().Where(r => r.ChildId == childId && eventIds.Contains(r.EventId)).ToDictionaryAsync(r => r.EventId, cancellationToken);
        return new YouthScheduleDto([.. events.Select(e =>
        {
            var answer = answers.GetValueOrDefault(e.Id);
            return new ScheduleSessionDto(e.Id, e.Name, programs[e.ProgramId], DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(e.StartsAt, zone).DateTime),
                e.StartsAt, e.EndsAt, e.Place, e.Status.ToString(), answer?.Response.ToString(), answer?.Note);
        })]);
    }
}
