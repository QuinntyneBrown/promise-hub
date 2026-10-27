using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The youth assigned to the calling mentor (L2-007 criterion 10, L2-062 criterion 5): children assigned to them directly plus the active
/// roster of every program that is not archived whose team includes them, once each, by name.
/// </summary>
public sealed class MentoringHandler(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<AssignedYouthDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var me = tenant.MembershipId;
        var direct = db.YouthMentors.AsNoTracking().Where(y => y.MentorMembershipId == me).Select(y => y.ChildId);
        var viaCohorts =
            from t in db.CohortMentors.AsNoTracking()
            where t.MentorMembershipId == me
            join p in db.Programs.AsNoTracking() on t.ProgramId equals p.Id
            where p.Status != ProgramStatus.Archived
            join e in db.Enrollments.AsNoTracking() on p.Id equals e.ProgramId
            where e.EndedAt == null
            select e.ChildId;
        var ids = (await direct.ToListAsync(cancellationToken)).Concat(await viaCohorts.ToListAsync(cancellationToken)).Distinct().ToList();
        var youth = await db.Children.AsNoTracking().Where(c => ids.Contains(c.Id))
            .OrderBy(c => c.FirstName).ThenBy(c => c.LastName)
            .Select(c => new MentoredYouthDto(c.Id, c.FirstName + " " + c.LastName))
            .ToListAsync(cancellationToken);
        return new AssignedYouthDto(youth);
    }
}
