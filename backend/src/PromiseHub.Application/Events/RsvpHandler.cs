using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;

namespace PromiseHub.Application.Events;

/// <summary>
/// A youth answers for a session (L2-094 criteria 2, 3 and 5, ADR 0064): another organization's or an unknown event is not found; a program
/// her child is not on is refused and audited; a session that has started, ended or been cancelled is closed (Conflict); the answer and note
/// are checked field by field; one row per event and child is inserted or replaced and audited without the note.
/// </summary>
public sealed class RsvpHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<(Result Result, RsvpDto? Rsvp)> HandleAsync(Guid eventId, RsvpRequest request, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return (Result.NotFound, null);
        }
        var childId = await YouthEvents.ChildAsync(db, tenant, cancellationToken);
        if (childId is null || !(await YouthEvents.ProgramIdsAsync(db, childId.Value, cancellationToken)).Contains(e.ProgramId))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Event", e.Id, $"{tenant.ActorName} tried to RSVP to {e.Name}, a session of a program she is not on"));
            await db.SaveChangesAsync(cancellationToken);
            return (Result.Forbidden, null);
        }
        var now = clock.GetUtcNow();
        if (e.Status != EventStatus.Scheduled || e.StartsAt <= now)
        {
            return (Result.Conflict, null);
        }
        var errors = new Dictionary<string, string>();
        if (!Enum.TryParse<RsvpResponse>(request.Response, ignoreCase: false, out var response) || !Enum.IsDefined(response) || int.TryParse(request.Response, out _))
        {
            errors["response"] = "Choose whether you’re going.";
        }
        var note = EventRules.Clean(request.Note);
        if (note is { Length: > EventRsvp.MaximumNote })
        {
            errors["note"] = "Keep it to 500 characters.";
        }
        if (errors.Count > 0)
        {
            return (Result.Invalid(errors), null);
        }
        var rsvp = await db.EventRsvps.FirstOrDefaultAsync(r => r.EventId == e.Id && r.ChildId == childId, cancellationToken);
        var action = rsvp is null ? AuditAction.Created : AuditAction.Updated;
        if (rsvp is null)
        {
            rsvp = new EventRsvp(Guid.NewGuid(), tenant.OrganizationId, e.Id, childId.Value, response, note, now);
            db.EventRsvps.Add(rsvp);
        }
        else
        {
            rsvp.Answer(response, note, now);
        }
        audit.Record(new AuditEvent(action, nameof(EventRsvp), rsvp.Id, $"{tenant.ActorName} answered {response} for {e.Name}",
            After: new { EventId = e.Id, Response = response.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, new RsvpDto(response.ToString(), note));
    }
}
