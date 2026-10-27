using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Curriculum;

/// <summary>The organization's progression framework (L2-086 criterion 1): its stages in order with the competencies that are not removed.</summary>
public sealed class ProgressionHandler(IPromiseHubDb db)
{
    public async Task<ProgressionDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var stages = await db.ProgressionStages.AsNoTracking().OrderBy(s => s.Position).ToListAsync(cancellationToken);
        var competencies = await db.Competencies.AsNoTracking().Where(c => c.RemovedAt == null).OrderBy(c => c.Position).ToListAsync(cancellationToken);
        return new ProgressionDto(stages.Select(s => new ProgressionStageDto(s.Id, s.Position, s.Name, s.Description,
            competencies.Where(c => c.StageId == s.Id).Select(c => new ProgressionCompetencyDto(c.Id, c.Name, c.Description)).ToList())).ToList());
    }
}
