using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Mentoring;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Where the signed-in youth stands in her organization's progression framework (L2-087 criterion 3, L2-088 criterion 1, ADR 0059): each
/// competency not removed, in framework order, with her child's latest assessment level; a stage is earned when every competency in it is at
/// Proficient or Mastered, and the first stage not earned is where she is.
/// </summary>
public sealed class LearnerStanding(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<IReadOnlyList<(Competency Competency, CompetencyLevel Level)>> CompetenciesAsync(CancellationToken cancellationToken = default)
    {
        var childId = await db.Memberships.AsNoTracking()
            .Where(m => m.Id == tenant.MembershipId && m.OrganizationId == tenant.OrganizationId)
            .Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        var competencies = await db.Competencies.AsNoTracking().Where(c => c.RemovedAt == null).OrderBy(c => c.Position).ToListAsync(cancellationToken);
        var latest = childId is { } child
            ? (await db.CompetencyAssessments.AsNoTracking().Where(a => a.ChildId == child).ToListAsync(cancellationToken))
                .GroupBy(a => a.CompetencyId).ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.At).First().Level)
            : [];
        return competencies.Select(c => (c, latest.GetValueOrDefault(c.Id, CompetencyLevel.NotStarted))).ToList();
    }

    public async Task<IReadOnlyList<JourneyStageDto>> StagesAsync(CancellationToken cancellationToken = default)
    {
        var stages = await db.ProgressionStages.AsNoTracking().OrderBy(s => s.Position).ToListAsync(cancellationToken);
        var competencies = await CompetenciesAsync(cancellationToken);
        var result = new List<JourneyStageDto>();
        var reached = false;
        foreach (var stage in stages)
        {
            var mine = competencies.Where(c => c.Competency.StageId == stage.Id).ToList();
            var proficient = mine.Count(c => c.Level is CompetencyLevel.Proficient or CompetencyLevel.Mastered);
            var status = reached ? "ahead" : proficient == mine.Count ? "earned" : "current";
            reached |= status == "current";
            result.Add(new JourneyStageDto(stage.Id, stage.Name, stage.Description, status, proficient, mine.Select(c => c.Competency.Name).ToList()));
        }
        return result;
    }
}
