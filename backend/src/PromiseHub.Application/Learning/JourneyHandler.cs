using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The youth's journey (L2-087, ADR 0059): computed on read from the same <see cref="LearnerProgress"/> the Learning home counts with, her lesson
/// completion times and her standing in the progression framework.
/// </summary>
public sealed class JourneyHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, LearnerStanding standing, TimeProvider clock)
{
    public async Task<JourneyDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await progress.TracksAsync(cancellationToken);
        var completedAt = await db.LessonProgress.AsNoTracking().Where(p => p.MembershipId == tenant.MembershipId)
            .Select(p => p.CompletedAt).ToListAsync(cancellationToken);
        var current = tracks.Select(t => (Track: t, Next: t.Next)).FirstOrDefault(x => x.Next is not null);
        return new JourneyDto(
            tracks.Sum(t => t.Done),
            tracks.Sum(t => t.Total),
            LearnerStreak.Weeks(completedAt, clock.GetUtcNow()),
            current.Next is { } next ? new JourneyCurrentDto(current.Track.Track.Id, next.Module.Module.Id, next.Module.Module.Title) : null,
            tracks.Select(t => new JourneyTrackDto(t.Track.Id, t.Track.Name, t.Done, t.Total,
                t.Modules.Select(m => new ModuleItemDto(m.Module.Id, m.Module.Title, m.Module.Description, m.Lessons.Count, m.Done, m.State, m.UnlockAfter)).ToList())).ToList(),
            await standing.StagesAsync(cancellationToken));
    }
}
