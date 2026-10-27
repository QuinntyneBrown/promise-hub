using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>Every track of the caller's organization with its modules in position order (L2-066 criterion 1).</summary>
public sealed class CurriculumHandler(IPromiseHubDb db)
{
    public async Task<CurriculumDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var tracks = await db.Tracks.AsNoTracking().OrderBy(t => t.Name).ToListAsync(cancellationToken);
        var modules = await db.CurriculumModules.AsNoTracking().OrderBy(m => m.Position).ToListAsync(cancellationToken);
        return new CurriculumDto(tracks.Select(t => new CurriculumTrackDto(
            t.Id, t.Name, t.Key, t.Description, t.Status.ToString(),
            modules.Where(m => m.TrackId == t.Id).Select(m => new CurriculumModuleSummaryDto(m.Id, m.Title, m.Status.ToString(), 0)).ToList())).ToList());
    }
}
