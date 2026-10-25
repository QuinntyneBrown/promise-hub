using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Events;

/// <summary>Keeps an event as cancelled, recording who, when and the message for guardians. Sending that message arrives with Messages.</summary>
public sealed class CancelEventHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> HandleAsync(Guid id, CancelEventCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e is null)
        {
            return Result.NotFound;
        }
        if (command.TellGuardians && string.IsNullOrWhiteSpace(command.Message))
        {
            return Result.Invalid(new Dictionary<string, string> { ["message"] = "Write the message to guardians." });
        }
        e.Cancel(tenant.ActorName, clock.GetUtcNow(), EventRules.Clean(command.Message), command.TellGuardians);
        audit.Record(new AuditEvent(AuditAction.Cancelled, "Event", e.Id, e.Name, After: command));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
