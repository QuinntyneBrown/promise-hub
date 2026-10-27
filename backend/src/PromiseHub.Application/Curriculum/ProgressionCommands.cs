using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Mentoring;

namespace PromiseHub.Application.Curriculum;

/// <summary>
/// Authors the progression framework (L2-086 criteria 2 to 6, ADR 0058): stages added last, edited and reordered as a whole; competencies
/// added to a stage after every competency of the organization, so a mentor's sheet keeps its order, and removed while their assessments
/// stay. Every write is audited.
/// </summary>
public sealed class ProgressionCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> AddStageAsync(StageCommand command, CancellationToken cancellationToken = default)
    {
        if (CheckStage(command) is { } invalid)
        {
            return invalid;
        }
        var last = await db.ProgressionStages.Select(s => (int?)s.Position).MaxAsync(cancellationToken) ?? 0;
        var stage = new ProgressionStage(Guid.NewGuid(), tenant.OrganizationId, last + 1, CurriculumRules.Clean(command.Name)!, CurriculumRules.Clean(command.Description) ?? "");
        db.ProgressionStages.Add(stage);
        audit.Record(new AuditEvent(AuditAction.Created, "ProgressionStage", stage.Id, stage.Name, After: new { stage.Name, stage.Description, stage.Position }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(stage.Id);
    }

    public async Task<Result> UpdateStageAsync(Guid id, StageCommand command, CancellationToken cancellationToken = default)
    {
        var stage = await db.ProgressionStages.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (stage is null)
        {
            return Result.NotFound;
        }
        if (CheckStage(command) is { } invalid)
        {
            return invalid;
        }
        var before = new { stage.Name, stage.Description };
        stage.Rename(CurriculumRules.Clean(command.Name)!, CurriculumRules.Clean(command.Description) ?? "");
        audit.Record(new AuditEvent(AuditAction.Updated, "ProgressionStage", id, stage.Name, before, new { stage.Name, stage.Description }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ReorderAsync(IReadOnlyList<Guid>? stageIds, CancellationToken cancellationToken = default)
    {
        var stages = await db.ProgressionStages.OrderBy(s => s.Position).ToListAsync(cancellationToken);
        if (!CurriculumRules.IsSameSet(stageIds, stages.Select(s => s.Id).ToList()))
        {
            return CurriculumRules.Invalid("stageIds", "Send every stage once.");
        }
        var before = stages.Select(s => s.Name).ToList();
        for (var i = 0; i < stageIds!.Count; i++)
        {
            stages.Single(s => s.Id == stageIds[i]).MoveTo(i + 1);
        }
        var after = stageIds.Select(id => stages.Single(s => s.Id == id).Name).ToList();
        audit.Record(new AuditEvent(AuditAction.Updated, "ProgressionStage", null, "Stage order", new { Stages = before }, new { Stages = after }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> AddCompetencyAsync(Guid stageId, CompetencyCommand command, CancellationToken cancellationToken = default)
    {
        var stage = await db.ProgressionStages.AsNoTracking().FirstOrDefaultAsync(s => s.Id == stageId, cancellationToken);
        if (stage is null)
        {
            return Result.NotFound;
        }
        var name = CurriculumRules.Clean(command.Name);
        var description = CurriculumRules.Clean(command.Description) ?? "";
        var errors = new Dictionary<string, string>();
        if (name is null)
        {
            errors["name"] = "Name the competency.";
        }
        else if (name.Length > Competency.MaximumName)
        {
            errors["name"] = "Keep the name under 80 characters.";
        }
        if (description.Length > Competency.MaximumDescription)
        {
            errors["description"] = "Keep the description under 300 characters.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var last = await db.Competencies.Select(c => (int?)c.Position).MaxAsync(cancellationToken) ?? 0;
        var competency = new Competency(Guid.NewGuid(), tenant.OrganizationId, last + 1, name!, description, stageId);
        db.Competencies.Add(competency);
        audit.Record(new AuditEvent(AuditAction.Created, "Competency", competency.Id, $"{name} in {stage.Name}", After: new { Name = name, Description = description, Stage = stage.Name }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(competency.Id);
    }

    public async Task<Result> RemoveCompetencyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var competency = await db.Competencies.FirstOrDefaultAsync(c => c.Id == id && c.RemovedAt == null, cancellationToken);
        if (competency is null)
        {
            return Result.NotFound;
        }
        competency.Remove(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Deleted, "Competency", id, $"{competency.Name} removed from the progression framework; its assessments are kept"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private static Result? CheckStage(StageCommand command)
    {
        var name = CurriculumRules.Clean(command.Name);
        var errors = new Dictionary<string, string>();
        if (name is null)
        {
            errors["name"] = "Give the stage a name.";
        }
        else if (name.Length > ProgressionStage.MaximumName)
        {
            errors["name"] = "Keep the name under 60 characters.";
        }
        if (CurriculumRules.Clean(command.Description)?.Length > ProgressionStage.MaximumDescription)
        {
            errors["description"] = "Keep the description under 200 characters.";
        }
        return errors.Count > 0 ? Result.Invalid(errors) : null;
    }
}
