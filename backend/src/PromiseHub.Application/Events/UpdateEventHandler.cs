using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Events;

public sealed class UpdateEventHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<Result> HandleAsync(Guid id, SaveEventCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e is null)
        {
            return Result.NotFound;
        }
        var errors = await EventRules.CheckAsync(db, command, cancellationToken);
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var before = new { e.Name, e.ProgramId, e.StartsAt, e.EndsAt, e.Place, e.RequiresSlip, e.NoShowAlert, e.StaffNotes };
        e.Update(command.ProgramId, command.Name.Trim(), command.StartsAt!.Value, command.EndsAt!.Value, EventRules.Clean(command.Place),
            command.RequiresSlip, command.NoShowAlert, EventRules.Clean(command.StaffNotes));
        if (e.RequiresSlip && !await db.PermissionSlips.AnyAsync(s => s.EventId == e.Id, cancellationToken))
        {
            db.PermissionSlips.Add(new PermissionSlip(Guid.NewGuid(), tenant.OrganizationId, e.Id, DateOnly.FromDateTime(e.StartsAt.UtcDateTime)));
        }
        audit.Record(new AuditEvent(AuditAction.Updated, "Event", e.Id, e.Name, before, command));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
