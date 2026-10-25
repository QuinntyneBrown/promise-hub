using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Events;

/// <summary>Creates an event; when it needs a slip, its draft slip is created in the same unit of work (L2-012 criterion 2).</summary>
public sealed class CreateEventHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(SaveEventCommand command, CancellationToken cancellationToken = default)
    {
        var errors = await EventRules.CheckAsync(db, command, cancellationToken);
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var e = new Event(Guid.NewGuid(), tenant.OrganizationId, command.ProgramId, command.Name.Trim(), command.StartsAt!.Value, command.EndsAt!.Value,
            EventRules.Clean(command.Place), command.RequiresSlip, command.NoShowAlert, EventRules.Clean(command.StaffNotes));
        db.Events.Add(e);
        if (e.RequiresSlip)
        {
            db.PermissionSlips.Add(new PermissionSlip(Guid.NewGuid(), tenant.OrganizationId, e.Id, DateOnly.FromDateTime(e.StartsAt.UtcDateTime)));
        }
        audit.Record(new AuditEvent(AuditAction.Created, "Event", e.Id, e.Name, After: command));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(e.Id);
    }
}
