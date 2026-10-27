using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The signed-in youth's mentor by name (ADR 0056): her own mentor, else the lead mentor of a program of hers that follows the track,
/// else none. A removed mentor is ignored.
/// </summary>
public sealed class YouthMentorName(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<string?> FindAsync(Guid trackId, CancellationToken cancellationToken = default)
    {
        var childId = await db.Memberships.AsNoTracking().Where(m => m.Id == tenant.MembershipId).Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        if (childId is not { } child)
        {
            return null;
        }
        var own = await db.YouthMentors.AsNoTracking().Where(y => y.ChildId == child).Select(y => (Guid?)y.MentorMembershipId).FirstOrDefaultAsync(cancellationToken);
        var leads = await (from e in db.Enrollments.AsNoTracking()
                           join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                           join t in db.CohortMentors.AsNoTracking() on p.Id equals t.ProgramId
                           where e.ChildId == child && e.EndedAt == null && p.TrackId == trackId && t.IsLead
                           select t.MentorMembershipId).ToListAsync(cancellationToken);
        foreach (var id in (own is { } o ? new[] { o } : []).Concat(leads))
        {
            var name = await db.Memberships.AsNoTracking().Where(m => m.Id == id && m.Role == Role.Mentor && m.RemovedAt == null)
                .Select(m => m.PersonName).FirstOrDefaultAsync(cancellationToken);
            if (name is not null)
            {
                return name;
            }
        }
        return null;
    }
}
