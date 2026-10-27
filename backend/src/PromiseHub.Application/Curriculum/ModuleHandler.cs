using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>One module of the caller's organization for the module editor, or null (L2-066 criteria 4 and 9).</summary>
public sealed class ModuleHandler(IPromiseHubDb db, CurriculumPrograms programs)
{
    public async Task<ModuleDetailDto?> HandleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var module = await db.CurriculumModules.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (module is null)
        {
            return null;
        }
        var track = await db.Tracks.AsNoTracking().SingleAsync(t => t.Id == module.TrackId, cancellationToken);
        var siblings = await db.CurriculumModules.AsNoTracking().Where(m => m.TrackId == module.TrackId).OrderBy(m => m.Position).ToListAsync(cancellationToken);
        var lessons = await db.Lessons.AsNoTracking().Where(l => l.ModuleId == id && l.DeletedAt == null).OrderBy(l => l.Position)
            .Select(l => new LessonSummaryDto(l.Id, l.Title, l.Minutes, l.Status.ToString())).ToListAsync(cancellationToken);
        return new ModuleDetailDto(module.Id, track.Id, track.Name, module.Title, module.Description, module.PrerequisiteModuleId, module.Anchor,
            module.Status.ToString(), module.Position, siblings.Count,
            siblings.Where(m => m.Position < module.Position).Select(m => new ModuleRefDto(m.Id, m.Title)).ToList(), lessons,
            await programs.FollowingAsync(track.Id, cancellationToken), await QuizzesAsync(id, cancellationToken),
            await db.Assignments.AsNoTracking().Where(a => a.ModuleId == id).OrderBy(a => a.Title)
                .Select(a => new AssignmentSummaryDto(a.Id, a.Title, a.LessonId == null ? null : db.Lessons.Where(l => l.Id == a.LessonId && l.DeletedAt == null).Select(l => l.Title).FirstOrDefault(),
                    a.Status.ToString(), a.TotalPoints)).ToListAsync(cancellationToken));
    }

    private async Task<List<QuizSummaryDto>> QuizzesAsync(Guid moduleId, CancellationToken cancellationToken)
    {
        var quizzes = await db.Quizzes.AsNoTracking().Where(q => q.ModuleId == moduleId).OrderBy(q => q.Title).ToListAsync(cancellationToken);
        var ids = quizzes.Select(q => q.Id).ToList();
        var counts = await db.QuizQuestions.AsNoTracking().Where(q => ids.Contains(q.QuizId)).GroupBy(q => q.QuizId)
            .Select(g => new { g.Key, Count = g.Count() }).ToDictionaryAsync(g => g.Key, g => g.Count, cancellationToken);
        var lessons = await db.Lessons.AsNoTracking().Where(l => l.ModuleId == moduleId && l.DeletedAt == null).ToDictionaryAsync(l => l.Id, l => l.Title, cancellationToken);
        return quizzes.Select(q => new QuizSummaryDto(q.Id, q.Title, q.LessonId is { } l && lessons.TryGetValue(l, out var t) ? t : null,
            q.Status.ToString(), counts.GetValueOrDefault(q.Id))).ToList();
    }
}
