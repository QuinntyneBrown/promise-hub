using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>Every track of the caller's organization with its modules in position order and the programs that follow it (L2-066 criteria 1 and 7).</summary>
public sealed class CurriculumHandler(IPromiseHubDb db, CurriculumPrograms programs)
{
    public async Task<CurriculumDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await db.Tracks.AsNoTracking().OrderBy(t => t.Name).ToListAsync(cancellationToken);
        var modules = await db.CurriculumModules.AsNoTracking().OrderBy(m => m.Position).ToListAsync(cancellationToken);
        var lessonCounts = await db.Lessons.AsNoTracking().Where(l => l.DeletedAt == null).GroupBy(l => l.ModuleId)
            .Select(g => new { ModuleId = g.Key, Count = g.Count() }).ToDictionaryAsync(g => g.ModuleId, g => g.Count, cancellationToken);
        var active = await programs.ActiveAsync(cancellationToken);
        return new CurriculumDto(tracks.Select(t => new CurriculumTrackDto(
            t.Id, t.Name, t.Key, t.Description, t.Status.ToString(),
            modules.Where(m => m.TrackId == t.Id).Select(m => new CurriculumModuleSummaryDto(m.Id, m.Title, m.Status.ToString(), lessonCounts.GetValueOrDefault(m.Id))).ToList(),
            active.Where(p => p.TrackId == t.Id).Select(p => new ProgramRefDto(p.Id, p.Name)).ToList())).ToList(), active);
    }
}
