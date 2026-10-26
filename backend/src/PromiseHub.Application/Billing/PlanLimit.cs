using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Billing;

namespace PromiseHub.Application.Billing;

/// <summary>Active children against the plan's limit (L2-037): a child counts once, however many programs they are in.</summary>
public sealed class PlanLimit(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<int> ActiveChildrenAsync(CancellationToken cancellationToken) =>
        await db.Enrollments.Where(e => e.EndedAt == null).Select(e => e.ChildId).Distinct().CountAsync(cancellationToken);

    /// <summary>Null when the children may be enrolled; otherwise why not. Children already active elsewhere don't count again.</summary>
    public async Task<string?> RefusalForAsync(IEnumerable<Guid> childIds, CancellationToken cancellationToken)
    {
        var ids = childIds.Distinct().ToList();
        var already = await db.Enrollments.Where(e => ids.Contains(e.ChildId) && e.EndedAt == null).Select(e => e.ChildId).Distinct().CountAsync(cancellationToken);
        var added = ids.Count - already;
        if (added == 0)
        {
            return null;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var terms = PlanTerms.For(organization.Plan);
        return await ActiveChildrenAsync(cancellationToken) + added > terms.ChildLimit
            ? $"Your {organization.Plan} plan covers {terms.ChildLimit} active children. Move to a bigger plan or end an enrollment."
            : null;
    }
}
