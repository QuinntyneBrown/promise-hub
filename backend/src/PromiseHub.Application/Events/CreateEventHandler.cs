using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Events;

/// <summary>
/// Creates an event, or with Repeat weekly one event a week at the same local time through the program's last day (L2-093, ADR 0064); each
/// that needs a slip gets its draft slip in the same unit of work (L2-012 criterion 2). A series is audited once.
/// </summary>
public sealed class CreateEventHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit)
{
    public async Task<EventCreation> HandleAsync(SaveEventCommand command, CancellationToken cancellationToken = default)
    {
        var errors = await EventRules.CheckAsync(db, tenant, command, cancellationToken);
        if (errors.Count > 0)
        {
            return new EventCreation(Result.Invalid(errors), 0);
        }
        var first = command.StartsAt!.Value;
        var length = command.EndsAt!.Value - first;
        IReadOnlyList<DateTimeOffset> starts = [first];
        Guid? seriesId = null;
        if (command.RepeatsWeekly)
        {
            var lastDay = await db.Programs.AsNoTracking().Where(p => p.Id == command.ProgramId).Select(p => p.EndsOn).SingleAsync(cancellationToken);
            starts = WeeklySeries.Starts(first, lastDay, await EventRules.ZoneAsync(db, tenant.OrganizationId, cancellationToken));
            seriesId = Guid.NewGuid();
        }
        var events = starts.Select(start => Add(command, start, start + length, seriesId)).ToList();
        var summary = seriesId is null ? events[0].Name : $"{events[0].Name} ({events.Count} weekly sessions)";
        audit.Record(new AuditEvent(AuditAction.Created, "Event", events[0].Id, summary, After: command));
        await db.SaveChangesAsync(cancellationToken);
        return new EventCreation(Result.Created(events[0].Id), events.Count);
    }

    private Event Add(SaveEventCommand command, DateTimeOffset startsAt, DateTimeOffset endsAt, Guid? seriesId)
    {
        var e = new Event(Guid.NewGuid(), tenant.OrganizationId, command.ProgramId, command.Name.Trim(), startsAt, endsAt,
            EventRules.Clean(command.Place), command.RequiresSlip, command.NoShowAlert, EventRules.Clean(command.StaffNotes));
        if (seriesId is { } id)
        {
            e.JoinSeries(id);
        }
        db.Events.Add(e);
        if (e.RequiresSlip)
        {
            db.PermissionSlips.Add(new PermissionSlip(Guid.NewGuid(), tenant.OrganizationId, e.Id, DateOnly.FromDateTime(e.StartsAt.UtcDateTime)));
        }
        return e;
    }
}
