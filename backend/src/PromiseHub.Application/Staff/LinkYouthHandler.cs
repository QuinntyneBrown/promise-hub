using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Staff;

/// <summary>
/// Links a youth account to one child record in the same organization (L2-045). The tenant filter makes another organization's
/// membership or child not found; a child links to at most one youth account. Every link is audited.
/// </summary>
public sealed class LinkYouthHandler(IPromiseHubDb db, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid membershipId, LinkYouthCommand command, CancellationToken cancellationToken = default)
    {
        var membership = await db.Memberships.FirstOrDefaultAsync(m => m.Id == membershipId && m.RemovedAt == null, cancellationToken);
        var child = command.ChildId is { } childId ? await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken) : null;
        if (membership is null || child is null)
        {
            return Result.NotFound;
        }
        if (membership.Role != Role.Youth)
        {
            return Result.Invalid(new Dictionary<string, string> { ["membershipId"] = "Only a youth account links to a child." });
        }
        if (await db.Memberships.AnyAsync(m => m.ChildId == child.Id && m.Id != membership.Id && m.RemovedAt == null, cancellationToken))
        {
            return Result.Invalid(new Dictionary<string, string> { ["childId"] = "This child already has a youth account." });
        }
        membership.LinkChild(child.Id);
        audit.Record(new AuditEvent(AuditAction.YouthLinked, "Membership", membership.Id, $"{membership.PersonName} linked to {child.FirstName} {child.LastName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
