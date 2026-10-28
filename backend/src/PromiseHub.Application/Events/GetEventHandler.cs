using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Events;

public sealed class GetEventHandler(IPromiseHubDb db)
{
    public async Task<EventDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e is null)
        {
            return null;
        }
        var program = await db.Programs.AsNoTracking().FirstAsync(p => p.Id == e.ProgramId, cancellationToken);
        var roster = await db.Enrollments.AsNoTracking().CountAsync(x => x.ProgramId == e.ProgramId && x.EndedAt == null, cancellationToken);
        var slips = await EventQueries.SlipStatusesAsync(db, cancellationToken);
        int? seriesSize = e.SeriesId is { } series ? await db.Events.CountAsync(x => x.SeriesId == series, cancellationToken) : null;
        return new EventDto(e.Id, e.Name, e.ProgramId, program.Name, e.StartsAt, e.EndsAt, e.Place, e.RequiresSlip, e.NoShowAlert, e.StaffNotes,
            roster, EventQueries.SlipStatus(e, slips), e.Status.ToString(), e.CancelledAt, e.CancelledBy, e.CancellationMessage, e.GuardiansTold, seriesSize,
            await EventRsvpSummary.ForAsync(db, e, cancellationToken));
    }
}
