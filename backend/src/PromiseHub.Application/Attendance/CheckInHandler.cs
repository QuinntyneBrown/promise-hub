using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Attendance;

/// <summary>Checks a child in now or at an earlier time (L2-017 criteria 1 and 2), late or not (L2-095); late needs QualifyAttendance (L2-100).</summary>
public sealed class CheckInHandler(AttendanceWriter writer, ITenantContext tenant, TimeProvider clock)
{
    public Task<Result> HandleAsync(Guid eventId, CheckInCommand command, CancellationToken cancellationToken = default)
    {
        if (command.Late && !RolePermissions.Has(tenant.Role, Permission.QualifyAttendance))
        {
            return Task.FromResult(Result.Forbidden);
        }
        var now = clock.GetUtcNow();
        var at = command.ArrivedAt is { } earlier && earlier < now ? earlier.ToUniversalTime() : now;
        return writer.ApplyAsync(eventId, command.ChildId, command.ClientActionId, command.Late ? AttendanceEventKind.CheckedInLate : AttendanceEventKind.CheckedIn, at,
            record => record.CheckIn(at, tenant.ActorName, command.Late), cancellationToken);
    }
}
