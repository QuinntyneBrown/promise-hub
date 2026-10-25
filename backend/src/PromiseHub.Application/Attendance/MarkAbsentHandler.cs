using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Attendance;

/// <summary>Marks a child absent. Texting the guardian arrives with Messages.</summary>
public sealed class MarkAbsentHandler(AttendanceWriter writer, ITenantContext tenant, TimeProvider clock)
{
    public Task<Result> HandleAsync(Guid eventId, MarkAbsentCommand command, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        return writer.ApplyAsync(eventId, command.ChildId, command.ClientActionId, AttendanceEventKind.MarkedAbsent, now,
            record => record.MarkAbsent(now, tenant.ActorName), cancellationToken);
    }
}
