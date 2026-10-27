using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>One live lesson of the caller's organization for the lesson editor, or null (L2-067 criteria 2, 6 and 9).</summary>
public sealed class LessonHandler(IPromiseHubDb db, CurriculumPrograms programs)
{
    public async Task<LessonDetailDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id && l.DeletedAt == null, cancellationToken);
        if (lesson is null)
        {
            return null;
        }
        var module = await db.CurriculumModules.AsNoTracking().SingleAsync(m => m.Id == lesson.ModuleId, cancellationToken);
        var track = await db.Tracks.AsNoTracking().SingleAsync(t => t.Id == module.TrackId, cancellationToken);
        var count = await db.Lessons.CountAsync(l => l.ModuleId == module.Id && l.DeletedAt == null, cancellationToken);
        return new LessonDetailDto(lesson.Id, module.Id, module.Title, track.Id, track.Name, lesson.Title, lesson.Reading, lesson.Minutes,
            CurriculumRules.SplitLines(lesson.Objectives), lesson.Body, CurriculumRules.SplitLines(lesson.Prompts), lesson.LeaderNotes,
            lesson.Status.ToString(), lesson.Position, count,
            lesson.VideoKey is null ? null : new LessonVideoDto(lesson.VideoFileName!, lesson.VideoBytes ?? 0, lesson.VideoUploadedAt!.Value, lesson.VideoUploadedBy!),
            await programs.FollowingAsync(track.Id, cancellationToken));
    }
}
