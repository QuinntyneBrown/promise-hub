namespace PromiseHub.Application.Learning;

/// <summary>The Learning home (L2-068 criterion 1).</summary>
public sealed class LearningHomeHandler(LearnerProgress progress)
{
    public async Task<LearningHomeDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await progress.TracksAsync(cancellationToken);
        var next = tracks.Select(t => t.Next).FirstOrDefault(n => n is not null);
        return new LearningHomeDto(
            tracks.Sum(t => t.Done),
            tracks.Sum(t => t.Total),
            next is { } n ? new NextLessonDto(n.Lesson.Lesson.Id, n.Lesson.Lesson.Kind.ToString(), n.Lesson.Lesson.Title, n.Module.Module.Id, n.Module.Module.Title,
                n.Lesson.Lesson.Reading, n.Lesson.Lesson.Minutes, n.Module.Done, n.Module.Lessons.Count) : null,
            tracks.Select(t => new TrackSummaryDto(t.Track.Id, t.Track.Name, t.Track.Description, t.Program, t.Done, t.Total)).ToList());
    }
}
