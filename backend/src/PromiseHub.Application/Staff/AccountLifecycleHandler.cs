using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Staff;

/// <summary>
/// Turns an account off and on (dialog: deactivate-person, L2-113, ADR 0070). A deactivated membership cannot start or continue a
/// session; nothing is deleted. A youth account follows its child record: deleting the household deactivates it, and it cannot be
/// reactivated while the child record is deleted. Admins cannot deactivate themselves. Every change is audited once.
/// </summary>
public sealed class AccountLifecycleHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> DeactivateAsync(Guid membershipId, CancellationToken cancellationToken = default)
    {
        var member = await db.Memberships.FirstOrDefaultAsync(m => m.Id == membershipId && m.RemovedAt == null, cancellationToken);
        if (member is null)
        {
            return Result.NotFound;
        }
        if (member.Id == tenant.MembershipId)
        {
            return Result.Invalid(new Dictionary<string, string> { ["member"] = "You can’t deactivate your own account. Ask another admin." });
        }
        if (member.DeactivatedAt is not null)
        {
            return Result.Done;
        }
        member.Deactivate(clock.GetUtcNow(), tenant.ActorName);
        audit.Record(new AuditEvent(AuditAction.Deactivated, "Membership", member.Id, $"{member.PersonName}’s account deactivated by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    public async Task<Result> ReactivateAsync(Guid membershipId, CancellationToken cancellationToken = default)
    {
        var member = await db.Memberships.FirstOrDefaultAsync(m => m.Id == membershipId && m.RemovedAt == null, cancellationToken);
        if (member is null)
        {
            return Result.NotFound;
        }
        if (member.DeactivatedAt is null)
        {
            return Result.Done;
        }
        // The query filter hides deleted children, so a deleted one is simply not found here.
        if (member.ChildId is { } childId && !await db.Children.AnyAsync(c => c.Id == childId, cancellationToken))
        {
            var first = member.PersonName.Split(' ')[0];
            return Result.Invalid(new Dictionary<string, string> { ["member"] = $"{first}’s child record was deleted, so the account stays off." });
        }
        member.Reactivate();
        audit.Record(new AuditEvent(AuditAction.Reactivated, "Membership", member.Id, $"{member.PersonName}’s account reactivated by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>Deactivates the youth accounts linked to children whose record is being deleted; the caller saves.</summary>
    public async Task DeactivateYouthOfAsync(IReadOnlyCollection<Guid> childIds, CancellationToken cancellationToken = default)
    {
        var youth = await db.Memberships
            .Where(m => m.Role == Role.Youth && m.RemovedAt == null && m.DeactivatedAt == null && m.ChildId != null && childIds.Contains(m.ChildId.Value))
            .ToListAsync(cancellationToken);
        foreach (var member in youth)
        {
            member.Deactivate(clock.GetUtcNow(), tenant.ActorName);
            audit.Record(new AuditEvent(AuditAction.Deactivated, "Membership", member.Id, $"{member.PersonName}’s account deactivated with the child record by {tenant.ActorName}"));
        }
    }
}
