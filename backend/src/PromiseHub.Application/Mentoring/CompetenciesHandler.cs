using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Mentoring;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// A youth's competencies for their mentor (L2-082, ADR 0057): 404 for a child outside the organization, 403 (audited) for one outside the
/// mentor's youth. Saving appends an assessment, audited as Created, for each competency whose level or note changed; earlier ones stay.
/// </summary>
public sealed class CompetenciesHandler(IPromiseHubDb db, ITenantContext tenant, MentorScope scope, IAuditWriter audit, TimeProvider clock)
{
    public async Task<(Result Result, CompetencySheetDto? Sheet)> GetAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var refused = await RefuseAsync(childId, cancellationToken);
        return refused is not null ? (refused, null) : (Result.Done, await SheetAsync(childId, cancellationToken));
    }

    public async Task<(Result Result, CompetencySheetDto? Sheet)> SaveAsync(Guid childId, SaveCompetenciesRequest request, CancellationToken cancellationToken = default)
    {
        if (await RefuseAsync(childId, cancellationToken) is { } refused)
        {
            return (refused, null);
        }
        var competencies = await db.Competencies.AsNoTracking().Where(c => c.RemovedAt == null).ToDictionaryAsync(c => c.Id, cancellationToken);
        var items = request.Items ?? [];
        var errors = new Dictionary<string, string>();
        var levels = new CompetencyLevel[items.Count];
        for (var i = 0; i < items.Count; i++)
        {
            if (!competencies.ContainsKey(items[i].CompetencyId))
            {
                errors["items"] = "Assess only your organization’s competencies.";
            }
            if (!Enum.TryParse(items[i].Level, out levels[i]) || !Enum.IsDefined(levels[i]) || int.TryParse(items[i].Level, out _))
            {
                errors[$"items.{i}.level"] = "Choose a level.";
            }
            if (items[i].Notes?.Trim().Length > CompetencyAssessment.MaximumNotes)
            {
                errors[$"items.{i}.notes"] = "Keep the note to 2,000 characters.";
            }
        }
        if (errors.Count > 0)
        {
            return (Result.Invalid(errors), null);
        }
        var latest = await LatestAsync(childId, cancellationToken);
        var now = clock.GetUtcNow();
        for (var i = 0; i < items.Count; i++)
        {
            var notes = string.IsNullOrWhiteSpace(items[i].Notes) ? null : items[i].Notes!.Trim();
            var before = latest.GetValueOrDefault(items[i].CompetencyId);
            if ((before?.Level ?? CompetencyLevel.NotStarted) == levels[i] && before?.Notes == notes)
            {
                continue;
            }
            // Later than the one it follows, so the latest is never ambiguous within the same clock tick.
            var at = before is not null && before.At >= now ? before.At.AddTicks(1) : now;
            var assessment = new CompetencyAssessment(Guid.NewGuid(), tenant.OrganizationId, childId, items[i].CompetencyId, levels[i], notes,
                tenant.MembershipId, tenant.ActorName, at);
            db.CompetencyAssessments.Add(assessment);
            audit.Record(new AuditEvent(AuditAction.Created, "CompetencyAssessment", assessment.Id,
                $"{competencies[items[i].CompetencyId].Name} set to {levels[i]} by {tenant.ActorName}",
                Before: new { Level = (before?.Level ?? CompetencyLevel.NotStarted).ToString() }, After: new { Level = levels[i].ToString(), HasNotes = notes is not null }));
        }
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, await SheetAsync(childId, cancellationToken));
    }

    private async Task<Result?> RefuseAsync(Guid childId, CancellationToken cancellationToken)
    {
        if (!await db.Children.AsNoTracking().AnyAsync(c => c.Id == childId, cancellationToken))
        {
            return Result.NotFound;
        }
        if (!await scope.CanSeeYouthAsync(childId, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", childId, "Competencies outside the mentor’s youth"));
            await db.SaveChangesAsync(cancellationToken);
            return Result.Forbidden;
        }
        return null;
    }

    private async Task<Dictionary<Guid, CompetencyAssessment>> LatestAsync(Guid childId, CancellationToken cancellationToken) =>
        (await db.CompetencyAssessments.AsNoTracking().Where(a => a.ChildId == childId).ToListAsync(cancellationToken))
            .GroupBy(a => a.CompetencyId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.At).First());

    private async Task<CompetencySheetDto> SheetAsync(Guid childId, CancellationToken cancellationToken)
    {
        var child = await db.Children.AsNoTracking().FirstAsync(c => c.Id == childId, cancellationToken);
        var competencies = await db.Competencies.AsNoTracking().Where(c => c.RemovedAt == null).OrderBy(c => c.Position).ToListAsync(cancellationToken);
        var latest = await LatestAsync(childId, cancellationToken);
        var items = competencies.Select(c =>
        {
            var a = latest.GetValueOrDefault(c.Id);
            return new CompetencyItemDto(c.Id, c.Name, c.Description, (a?.Level ?? CompetencyLevel.NotStarted).ToString(), a?.Notes, a?.AssessorName, a?.At);
        }).ToList();
        return new CompetencySheetDto(childId, child.FullName, items, items.Count(i => i.Level is "Proficient" or "Mastered"), items.Count);
    }
}
