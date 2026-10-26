using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>A youth's own record (L2-007 criterion 9, L2-045): only the child linked to the caller's membership, never another.</summary>
public sealed class LearnerHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task<LearnerDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var childId = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        var child = childId is { } id ? await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken) : null;
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        return new LearnerDto(tenant.ActorName, child is null ? null : new LearnerChildDto(child.Id, child.FirstName, child.LastName, child.AgeOn(today)));
    }
}
