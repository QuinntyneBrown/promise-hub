namespace PromiseHub.Application.Learning;

/// <summary>
/// Opens a lesson's video for a youth who may open the lesson (L2-069 criterion 3, ADR 0051): not visible or no video answers not
/// found, locked answers locked. The key comes only from the lesson row, so no other organization's file can be named.
/// </summary>
public sealed class LessonVideoStream(LearnerProgress progress, IFileStore files)
{
    public async Task<Gated<VideoStream>> OpenAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found)
        {
            return Gated<VideoStream>.NotFound();
        }
        var status = found.Lesson;
        if (status.Locked)
        {
            return Gated<VideoStream>.Locked(status.UnlockAfter);
        }
        if (status.Lesson.VideoKey is not { } key || await files.OpenReadAsync(key, cancellationToken) is not { } content)
        {
            return Gated<VideoStream>.NotFound();
        }
        return Gated<VideoStream>.Found(new VideoStream(content, status.Lesson.VideoContentType ?? "video/mp4"));
    }
}
