using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Events;

/// <summary>Events: upcoming (not yet ended), needing slips (a slip not yet sent) or past, optionally for one program.</summary>
public sealed class ListEventsHandler(IPromiseHubDb db, TimeProvider clock)
{
    public async Task<EventListDto> HandleAsync(string? filter, Guid? programId, string? q, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var events = await db.Events.AsNoTracking().ToListAsync(cancellationToken);
        var programs = await db.Programs.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var rosters = await EventQueries.RosterSizesAsync(db, cancellationToken);
        var slips = await EventQueries.SlipStatusesAsync(db, cancellationToken);
        var rows = events
            .Select(e => new EventSummaryDto(e.Id, e.Name, e.ProgramId, programs.GetValueOrDefault(e.ProgramId, ""), e.StartsAt, e.EndsAt, e.Place,
                rosters.GetValueOrDefault(e.ProgramId), EventQueries.SlipStatus(e, slips), e.Status.ToString()))
            .ToList();
        var upcoming = rows.Where(e => e.EndsAt >= now).ToList();
        var needSlips = upcoming.Where(e => e.Status == "Scheduled" && e.SlipStatus == "Draft").ToList();
        var chosen = filter switch
        {
            "past" => rows.Where(e => e.EndsAt < now).OrderByDescending(e => e.StartsAt).ToList(),
            "needs-slips" => needSlips.OrderBy(e => e.StartsAt).ToList(),
            _ => upcoming.OrderBy(e => e.StartsAt).ToList(),
        };
        var matches = chosen
            .Where(e => programId is null || e.ProgramId == programId)
            .Where(e => string.IsNullOrWhiteSpace(q) || $"{e.Name} {e.ProgramName} {e.Place}".Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
            .ToList();
        return new EventListDto(matches, upcoming.Count, needSlips.Count);
    }
}
