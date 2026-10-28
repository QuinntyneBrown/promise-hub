using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Which sessions the caller may open and run. Roles that run sessions without <see cref="Permission.RunAnySession"/>
/// (youth workers, volunteers) are limited to the sessions they are assigned to (L2-007 criterion 6); a mentor also runs the
/// sessions of the cohorts on whose mentor team they are (L2-095, ADR 0065); everyone else is unrestricted.
/// </summary>
public sealed class SessionAccess(IPromiseHubDb db, ITenantContext tenant)
{
    public bool Scoped => RolePermissions.Has(tenant.Role, Permission.RunSessions) && !RolePermissions.Has(tenant.Role, Permission.RunAnySession);

    public async Task<bool> AllowsAsync(Guid eventId, CancellationToken cancellationToken) =>
        !Scoped || (await AssignedAsync(cancellationToken))!.Contains(eventId);

    public async Task<HashSet<Guid>?> AssignedAsync(CancellationToken cancellationToken)
    {
        if (!Scoped)
        {
            return null;
        }
        var me = tenant.MembershipId;
        var assigned = await db.SessionStaff.Where(s => s.MembershipId == me).Select(s => s.EventId).ToListAsync(cancellationToken);
        if (tenant.Role == Role.Mentor)
        {
            var cohorts = await (
                from t in db.CohortMentors
                where t.MentorMembershipId == me
                join p in db.Programs on t.ProgramId equals p.Id
                where p.Status != ProgramStatus.Archived
                select p.Id).ToListAsync(cancellationToken);
            assigned.AddRange(await db.Events.Where(e => cohorts.Contains(e.ProgramId)).Select(e => e.Id).ToListAsync(cancellationToken));
        }
        return [.. assigned];
    }
}
