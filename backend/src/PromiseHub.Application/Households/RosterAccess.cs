using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Attendance;

namespace PromiseHub.Application.Households;

/// <summary>
/// Which children the caller may read. Youth workers (<see cref="SessionAccess.Scoped"/>) read only the children
/// actively enrolled in a program with a session they are assigned to; everyone else reads every child (L2-007 criterion 7).
/// </summary>
public sealed class RosterAccess(IPromiseHubDb db, SessionAccess sessions)
{
    public async Task<HashSet<Guid>?> PermittedChildrenAsync(CancellationToken cancellationToken)
    {
        if (await sessions.AssignedAsync(cancellationToken) is not { } assigned)
        {
            return null;
        }
        var programs = await db.Events.Where(e => assigned.Contains(e.Id)).Select(e => e.ProgramId).Distinct().ToListAsync(cancellationToken);
        return [.. await db.Enrollments.Where(e => programs.Contains(e.ProgramId) && e.EndedAt == null).Select(e => e.ChildId).ToListAsync(cancellationToken)];
    }
}
