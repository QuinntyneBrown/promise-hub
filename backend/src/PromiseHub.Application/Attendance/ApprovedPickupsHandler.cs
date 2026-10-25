using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Households;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Adds and removes the adults besides the guardians who may collect a child (L2-020 criteria 1, 2 and 5), for staff and,
/// through the family page, for the household's guardians. The Quick Card and sign-out read the same rows. A removal by
/// staff texts the primary guardian; every change is audited.
/// </summary>
public sealed class ApprovedPickupsHandler(IPromiseHubDb db, ITenantContext tenant, AudienceResolver resolver, MessageWriter writer, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> AddAsync(Guid childId, AddPickupCommand command, bool byGuardian, string actor, Guid? householdId = null, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId && (householdId == null || c.HouseholdId == householdId), cancellationToken);
        if (child is null)
        {
            return Result.NotFound;
        }
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors["name"] = "Enter the adult’s full name.";
        }
        if (string.IsNullOrWhiteSpace(command.Relationship))
        {
            errors["relationship"] = $"Say how they know {child.FirstName}.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }
        var children = command.Siblings
            ? await db.Children.AsNoTracking().Where(c => c.HouseholdId == child.HouseholdId).ToListAsync(cancellationToken)
            : [child];
        var now = clock.GetUtcNow();
        Guid first = Guid.Empty;
        foreach (var c in children)
        {
            var pickup = new ApprovedPickup(Guid.NewGuid(), tenant.OrganizationId, c.Id, c.HouseholdId, command.Name!.Trim(), command.Relationship!.Trim(),
                string.IsNullOrWhiteSpace(command.Mobile) ? null : command.Mobile.Trim(), byGuardian, actor, now);
            db.ApprovedPickups.Add(pickup);
            first = c.Id == child.Id ? pickup.Id : first;
            audit.Record(new AuditEvent(AuditAction.Created, "ApprovedPickup", pickup.Id, $"{pickup.Name} may pick up {c.FullName} · added by {actor}"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(first);
    }

    public async Task<Result> RemoveAsync(Guid childId, Guid pickupId, bool byGuardian, string actor, Guid? householdId = null, CancellationToken cancellationToken = default)
    {
        var pickup = await db.ApprovedPickups.FirstOrDefaultAsync(p => p.Id == pickupId && p.ChildId == childId && p.RemovedAt == null
            && (householdId == null || p.HouseholdId == householdId), cancellationToken);
        if (pickup is null)
        {
            return Result.NotFound;
        }
        var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == childId, cancellationToken);
        pickup.Remove(actor, clock.GetUtcNow());
        audit.Record(new AuditEvent(AuditAction.Deleted, "ApprovedPickup", pickup.Id, $"{pickup.Name} removed from {child.FullName}’s approved pickups by {actor}"));
        if (!byGuardian)
        {
            var body = $"{pickup.Name} was removed from {child.FirstName}’s approved pickups by {actor}.";
            var audience = await resolver.ForHouseholdAsync(pickup.HouseholdId, cancellationToken);
            writer.Queue(MessageSource.Pickup, $"Approved pickups: {child.FirstName}", body, ChannelChoice.TextWithEmailFallback, audience,
                new AudienceRequest(null, null, null, body, ChannelChoice.TextWithEmailFallback));
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
