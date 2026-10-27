using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Where a youth is placed (L2-059 criterion 3, L2-060, ADR 0047): the linked child's active enrollment in a program that is not
/// archived, in the caller's organization, earliest start first. Read on every call, so enrolling takes effect at once.
/// </summary>
public sealed class Placement(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<OnboardingProgramDto?> ForMembershipAsync(Guid membershipId, CancellationToken cancellationToken = default)
    {
        var childId = await db.Memberships.AsNoTracking()
            .Where(m => m.Id == membershipId && m.OrganizationId == tenant.OrganizationId)
            .Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        if (childId is not { } child)
        {
            return null;
        }
        return await (from e in db.Enrollments.AsNoTracking()
                      join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                      where e.ChildId == child && e.EndedAt == null && p.Status != ProgramStatus.Archived
                            && e.OrganizationId == tenant.OrganizationId && p.OrganizationId == tenant.OrganizationId
                      orderby p.StartsOn
                      select new OnboardingProgramDto(p.Name, p.Schedule, p.StartsOn, p.EndsOn)).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> IsPlacedAsync(Guid membershipId, CancellationToken cancellationToken = default) =>
        await ForMembershipAsync(membershipId, cancellationToken) is not null;
}
