using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Slips;

/// <summary>Every slip of events that need one, soonest deadline first, with its answers so far.</summary>
public sealed class ListSlipsHandler(IPromiseHubDb db, SlipReader reader)
{
    public async Task<SlipListDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var slips = await db.PermissionSlips.AsNoTracking().ToListAsync(cancellationToken);
        var events = await db.Events.AsNoTracking().ToDictionaryAsync(e => e.Id, cancellationToken);
        var programs = await db.Programs.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);
        var rows = new List<SlipRowDto>();
        foreach (var slip in slips.Where(s => events.ContainsKey(s.EventId)).OrderBy(s => s.SignBy))
        {
            var e = events[slip.EventId];
            var responses = await reader.ResponsesAsync(slip, e.ProgramId, cancellationToken);
            rows.Add(new SlipRowDto(slip.Id, e.Id, string.IsNullOrEmpty(slip.Title) ? e.Name : slip.Title, programs.GetValueOrDefault(e.ProgramId, ""),
                slip.SignBy, slip.Status.ToString(), responses.Count, responses.Count(r => r.Status == "Signed"), responses.Count(r => r.Status == "Declined")));
        }
        return new SlipListDto(rows);
    }
}
