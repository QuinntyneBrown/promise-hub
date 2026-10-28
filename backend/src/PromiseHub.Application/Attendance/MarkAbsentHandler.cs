using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Attendance;

/// <summary>Marks a child absent, excused or not (L2-095). Texting the guardian arrives with Messages.</summary>
public sealed class MarkAbsentHandler(AttendanceWriter writer, ITenantContext tenant, TimeProvider clock)
{
    public Task<Result> HandleAsync(Guid eventId, MarkAbsentCommand command, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        return writer.ApplyAsync(eventId, command.ChildId, command.ClientActionId, command.Excused ? AttendanceEventKind.MarkedExcused : AttendanceEventKind.MarkedAbsent, now,
            record => record.MarkAbsent(now, tenant.ActorName, command.Excused), cancellationToken);
    }
}
