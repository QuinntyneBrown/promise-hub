using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Households of the event's program with a child who has not signed or declined the slip's current version.</summary>
public sealed class SlipFamilies(IPromiseHubDb db)
{
    public async Task<List<SlipFamily>> UnsignedAsync(PermissionSlip slip, Event e, CancellationToken cancellationToken)
    {
        var children = await (
            from en in db.Enrollments.AsNoTracking()
            where en.ProgramId == e.ProgramId && en.EndedAt == null
            join c in db.Children.AsNoTracking() on en.ChildId equals c.Id
            select new { c.Id, c.FirstName, c.HouseholdId }).ToListAsync(cancellationToken);
        var answered = await db.SlipSignatures.AsNoTracking()
            .Where(s => s.SlipId == slip.Id && s.Version == slip.Version && s.Status != SignatureStatus.Superseded)
            .Select(s => s.ChildId).ToListAsync(cancellationToken);
        var outstanding = children.Where(c => !answered.Contains(c.Id)).ToList();
        var householdIds = outstanding.Select(c => c.HouseholdId).Distinct().ToList();
        var households = await db.Households.AsNoTracking().Where(h => householdIds.Contains(h.Id)).ToListAsync(cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => householdIds.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        return [.. households.OrderBy(h => h.Name).Select(h =>
        {
            var own = guardians.Where(g => g.HouseholdId == h.Id).ToList();
            var primary = own.OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name).FirstOrDefault();
            var reachable = own.Any(g => g.Reachable);
            var reason = reachable ? null : own.Any(g => g.EmailBounced) ? "Email bounced, no mobile" : "No mobile or email";
            return new SlipFamily(h.Id, h.Name, primary?.Name,
                [.. outstanding.Where(c => c.HouseholdId == h.Id).OrderBy(c => c.FirstName).Select(c => (c.Id, c.FirstName))], reachable, reason);
        })];
    }
}
