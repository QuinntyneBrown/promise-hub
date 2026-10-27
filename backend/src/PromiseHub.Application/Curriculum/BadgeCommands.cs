using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Creates, updates and deletes badges (L2-084 criteria 2 to 5). Every write is audited; deleting keeps the badge's awards.</summary>
public sealed class BadgeCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> CreateAsync(BadgeCommand command, CancellationToken cancellationToken = default)
    {
        var (fields, errors) = await BadgeRules.CheckAsync(db, command, cancellationToken);
        if (fields is null)
        {
            return Result.Invalid(errors);
        }
        var badge = new Badge(Guid.NewGuid(), tenant.OrganizationId, fields.Name, fields.Icon, fields.Description, fields.Kind, fields.Rule, fields.TargetId,
            fields.CompetencyId, clock.GetUtcNow());
        db.Badges.Add(badge);
        audit.Record(new AuditEvent(AuditAction.Created, "Badge", badge.Id, fields.Name, After: Snapshot(badge)));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(badge.Id);
    }

    public async Task<Result> UpdateAsync(Guid id, BadgeCommand command, CancellationToken cancellationToken = default)
    {
        var badge = await db.Badges.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null, cancellationToken);
        if (badge is null)
        {
            return Result.NotFound;
        }
        var (fields, errors) = await BadgeRules.CheckAsync(db, command, cancellationToken);
        if (fields is null)
        {
            return Result.Invalid(errors);
        }
        var before = Snapshot(badge);
        badge.Update(fields.Name, fields.Icon, fields.Description, fields.Kind, fields.Rule, fields.TargetId, fields.CompetencyId);
        audit.Record(new AuditEvent(AuditAction.Updated, "Badge", id, fields.Name, before, Snapshot(badge)));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var badge = await db.Badges.FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null, cancellationToken);
        if (badge is null)
        {
            return Result.NotFound;
        }
        badge.Delete(clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Deleted, "Badge", id, $"{badge.Name} deleted; youth who earned it keep it"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private static object Snapshot(Badge b) =>
        new { b.Name, b.Icon, b.Description, Kind = b.Kind.ToString(), Rule = b.Rule?.ToString(), b.TargetId, b.CompetencyId };
}
