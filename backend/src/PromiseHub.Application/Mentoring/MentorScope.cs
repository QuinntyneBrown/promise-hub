using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The signed-in mentor's scope (L2-065, ADR 0049): the cohorts they lead or support that are not archived, and their youth, which are
/// the children assigned to them directly plus the active roster of each of those cohorts (L2-062 criterion 5). Every Mentoring read asks here.
/// </summary>
public sealed class MentorScope(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<IReadOnlyList<MentorCohortRef>> CohortsAsync(CancellationToken cancellationToken = default)
    {
        var me = tenant.MembershipId;
        return await (
            from t in db.CohortMentors.AsNoTracking()
            where t.MentorMembershipId == me
            join p in db.Programs.AsNoTracking() on t.ProgramId equals p.Id
            where p.Status != ProgramStatus.Archived
            select new MentorCohortRef(p.Id, t.IsLead)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> YouthIdsAsync(CancellationToken cancellationToken = default)
    {
        var me = tenant.MembershipId;
        var cohortIds = (await CohortsAsync(cancellationToken)).Select(c => c.ProgramId).ToList();
        var direct = await db.YouthMentors.AsNoTracking().Where(y => y.MentorMembershipId == me).Select(y => y.ChildId).ToListAsync(cancellationToken);
        var viaCohorts = await db.Enrollments.AsNoTracking().Where(e => cohortIds.Contains(e.ProgramId) && e.EndedAt == null)
            .Select(e => e.ChildId).ToListAsync(cancellationToken);
        return [.. direct.Concat(viaCohorts).Distinct()];
    }

    public async Task<bool> CanSeeYouthAsync(Guid childId, CancellationToken cancellationToken = default) =>
        (await YouthIdsAsync(cancellationToken)).Contains(childId);
}
