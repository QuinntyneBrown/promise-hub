using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Events;

/// <summary>What a youth's schedule reads: the child her membership links to and the active programs that child is on (ADR 0064).</summary>
public static class YouthEvents
{
    public static async Task<Guid?> ChildAsync(IPromiseHubDb db, ITenantContext tenant, CancellationToken cancellationToken) =>
        await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);

    public static async Task<List<Guid>> ProgramIdsAsync(IPromiseHubDb db, Guid childId, CancellationToken cancellationToken) =>
        await db.Enrollments.AsNoTracking()
            .Where(e => e.ChildId == childId && e.EndedAt == null)
            .Join(db.Programs.AsNoTracking().Where(p => p.Status == ProgramStatus.Active), e => e.ProgramId, p => p.Id, (e, _) => e.ProgramId)
            .Distinct()
            .ToListAsync(cancellationToken);
}
