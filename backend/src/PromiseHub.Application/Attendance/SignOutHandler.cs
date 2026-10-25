using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Signs a checked-in child out to an approved adult, or to someone else the primary guardian okayed by phone
/// (L2-017 criterion 3, L2-020 criterion 3). Anyone else is refused with whom to call.
/// </summary>
public sealed class SignOutHandler(IPromiseHubDb db, AttendanceWriter writer, ITenantContext tenant, TimeProvider clock, SessionAccess access)
{
    public async Task<Result> HandleAsync(Guid eventId, SignOutCommand command, CancellationToken cancellationToken = default)
    {
        if (!await db.Events.AnyAsync(e => e.Id == eventId, cancellationToken))
        {
            return Result.NotFound;
        }
        if (!await access.AllowsAsync(eventId, cancellationToken))
        {
            return Result.Forbidden;
        }
        if (await db.AttendanceEvents.AnyAsync(x => x.ClientActionId == command.ClientActionId, cancellationToken))
        {
            return Result.Done;
        }
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == command.ChildId, cancellationToken);
        if (child is not null)
        {
            var record = await db.AttendanceRecords.AsNoTracking()
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.ChildId == child.Id, cancellationToken);
            if (record?.Status != AttendanceStatus.Present)
            {
                return Result.Invalid(new Dictionary<string, string> { ["childId"] = $"{child.FullName} is not checked in." });
            }
        }

        var guardians = child is null
            ? []
            : await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == child.HouseholdId).ToListAsync(cancellationToken);
        var primary = guardians.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
        var first = child?.FirstName ?? "the child";
        var errors = new Dictionary<string, string>();
        string? collectedBy = null;
        if (command.GuardianId is { } guardianId)
        {
            var guardian = guardians.FirstOrDefault(g => g.Id == guardianId && g.CanPickUp);
            if (guardian is null)
            {
                errors["who"] = $"Not on {first}’s approved list. Call {primary?.Name} at {primary?.Mobile} before {first} leaves.";
            }
            collectedBy = guardian?.Name;
        }
        else if (command.SomeoneElse)
        {
            if (string.IsNullOrWhiteSpace(command.OtherName))
            {
                errors["otherName"] = "Enter their name.";
            }
            var asked = string.IsNullOrWhiteSpace(command.OtherName) ? [] : (await db.PickupRequests.AsNoTracking()
                .Where(r => r.EventId == eventId && r.ChildId == command.ChildId && r.Status != PickupRequestStatus.Pending).ToListAsync(cancellationToken))
                .Where(r => r.IsFor(command.OtherName!)).ToList();
            if (asked.Any(r => r.Status == PickupRequestStatus.Refused))
            {
                errors["otherName"] = $"{primary?.Name ?? "The guardian"} refused this pickup. {first} stays with staff.";
            }
            else if (!command.GuardianConfirmed && !asked.Any(r => r.Status == PickupRequestStatus.Approved))
            {
                errors["guardianConfirmed"] = $"{primary?.Name ?? "The guardian"} needs to okay this by phone first.";
            }
            collectedBy = command.OtherName?.Trim();
        }
        else
        {
            errors["who"] = $"Choose who is taking {first} home.";
        }
        if (!command.IdChecked)
        {
            errors["idChecked"] = "Check photo ID, or confirm you know this person.";
        }
        if (errors.Count > 0)
        {
            return Result.Invalid(errors);
        }

        var now = clock.GetUtcNow();
        var at = command.LeftAt is { } earlier && earlier < now ? earlier.ToUniversalTime() : now;
        var someoneElse = command.GuardianId is null;
        return await writer.ApplyAsync(eventId, command.ChildId, command.ClientActionId, AttendanceEventKind.SignedOut, at,
            record => record.SignOut(at, collectedBy!, command.GuardianId, someoneElse && command.GuardianConfirmed, command.IdChecked, tenant.ActorName),
            cancellationToken);
    }
}
