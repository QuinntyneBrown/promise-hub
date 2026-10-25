using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Incidents;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Asks the guardian about an adult who is not on the approved list (L2-020 criterion 7): the household is texted a link to
/// the family page, where the guardian approves or refuses. An approval stands in for the phone okay at sign-out; a refusal
/// keeps the child, blocks that adult, and logs a pickup incident under the staff member who asked.
/// </summary>
public sealed class PickupRequestHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, AudienceResolver resolver, MessageWriter writer, GuardianLinkIssuer links, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> AskAsync(Guid eventId, AskForPickupCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == command.ChildId, cancellationToken);
        if (e is null || child is null)
        {
            return Result.NotFound;
        }
        var errors = new Dictionary<string, string>();
        var record = await db.AttendanceRecords.AsNoTracking().FirstOrDefaultAsync(r => r.EventId == eventId && r.ChildId == child.Id, cancellationToken);
        if (record?.Status != AttendanceStatus.Present)
        {
            errors["childId"] = $"{child.FullName} is not checked in.";
        }
        if (string.IsNullOrWhiteSpace(command.CollectorName))
        {
            errors["collectorName"] = "Enter their name.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var request = new PickupRequest(Guid.NewGuid(), tenant.OrganizationId, eventId, child.Id, child.HouseholdId, command.CollectorName!.Trim(), tenant.MembershipId, tenant.ActorName, clock.GetUtcNow());
        db.PickupRequests.Add(request);
        var body = $"{request.CollectorName} is at {e.Name} to collect {child.FirstName}. Approve or refuse here: {links.IssueHome(child.HouseholdId)}";
        var audience = await resolver.ForHouseholdAsync(child.HouseholdId, cancellationToken);
        writer.Queue(MessageSource.Pickup, $"Pickup: {child.FirstName}", body, ChannelChoice.TextWithEmailFallback, audience,
            new AudienceRequest(e.ProgramId, e.Id, null, body, ChannelChoice.TextWithEmailFallback));
        audit.Record(new AuditEvent(AuditAction.Created, "PickupRequest", request.Id, $"{request.CollectorName} asked to collect {child.FullName} · guardian asked by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(request.Id);
    }

    public async Task<PickupRequestDto?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        await db.PickupRequests.AsNoTracking().Where(r => r.Id == id)
            .Select(r => new PickupRequestDto(r.Id, r.ChildId, r.CollectorName, r.Status.ToString(), r.DecidedBy, r.DecidedAt, r.IncidentId))
            .FirstOrDefaultAsync(cancellationToken);

    /// <summary>The guardian's decision from the family page, for the household's own pending request only.</summary>
    public async Task<bool> DecideAsync(Guid id, Guid householdId, bool approve, string guardian, CancellationToken cancellationToken = default)
    {
        var request = await db.PickupRequests.FirstOrDefaultAsync(r => r.Id == id && r.HouseholdId == householdId && r.Status == PickupRequestStatus.Pending, cancellationToken);
        if (request is null)
        {
            return false;
        }
        var now = clock.GetUtcNow();
        request.Decide(approve, guardian, now);
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == request.ChildId, cancellationToken);
        audit.Record(new AuditEvent(AuditAction.Updated, "PickupRequest", request.Id,
            $"{guardian} {(approve ? "approved" : "refused")} {request.CollectorName} collecting {child.FullName}"));
        if (!approve && await modules.IsOnAsync(ModuleId.Incidents, cancellationToken))
        {
            var e = await db.Events.AsNoTracking().SingleAsync(x => x.Id == request.EventId, cancellationToken);
            var incident = new Incident(Guid.NewGuid(), request.OrganizationId, IncidentCategory.PickupOrSafeguarding, child.Id, now, e.Place ?? e.Name,
                $"{request.CollectorName} asked to collect {child.FirstName} at {e.Name}. They were not on the approved list. {guardian} refused by text.",
                $"{child.FirstName} stayed with staff. {request.RequestedBy} asked the guardian through PromiseHub.",
                GuardianContactStatus.CalledAndReached, IncidentSeverity.Moderate, request.RequestedById, request.RequestedBy, now);
            db.Incidents.Add(incident);
            request.Logged(incident.Id);
            audit.Record(new AuditEvent(AuditAction.Created, "Incident", incident.Id, $"{incident.Category} · {child.FullName} · refused pickup logged"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
