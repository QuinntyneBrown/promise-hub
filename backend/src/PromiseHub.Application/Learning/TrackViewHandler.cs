namespace PromiseHub.Application.Learning;

/// <summary>One of the youth's tracks with its modules in order (L2-068 criterion 2); not visible answers not found.</summary>
public sealed class TrackViewHandler(LearnerProgress progress)
{
    public async Task<Gated<TrackViewDto>> HandleAsync(Guid trackId, CancellationToken cancellationToken = default)
    {
        var tracks = await progress.TracksAsync(cancellationToken);
        var track = tracks.FirstOrDefault(t => t.Track.Id == trackId);
        if (track is null)
        {
            return Gated<TrackViewDto>.NotFound();
        }
        return Gated<TrackViewDto>.Found(new TrackViewDto(track.Track.Id, track.Track.Name, track.Track.Description, track.Done, track.Total,
            tracks.Select(t => new TrackRefDto(t.Track.Id, t.Track.Name)).ToList(),
            track.Modules.Select(m => new ModuleItemDto(m.Module.Id, m.Module.Title, m.Module.Description, m.Lessons.Count, m.Done, m.State, m.UnlockAfter)).ToList()));
    }
}
