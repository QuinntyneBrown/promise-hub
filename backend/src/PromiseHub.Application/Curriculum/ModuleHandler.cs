using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>One module of the caller's organization for the module editor, or null (L2-066 criteria 4 and 9).</summary>
public sealed class ModuleHandler(IPromiseHubDb db)
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
            siblings.Where(m => m.Position < module.Position).Select(m => new ModuleRefDto(m.Id, m.Title)).ToList(), lessons);
    }
}
