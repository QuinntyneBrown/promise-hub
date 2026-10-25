using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>The children a slip is for (enrolled in the event's program) and their answers to its current version.</summary>
public sealed class SlipReader(IPromiseHubDb db)
{
    public async Task<List<SlipResponseDto>> ResponsesAsync(PermissionSlip slip, Guid programId, CancellationToken cancellationToken)
    {
        var children = await (
            from en in db.Enrollments.AsNoTracking()
            where en.ProgramId == programId && en.EndedAt == null
            join c in db.Children.AsNoTracking() on en.ChildId equals c.Id
            join h in db.Households.AsNoTracking() on c.HouseholdId equals h.Id
            select new { c.Id, c.FirstName, c.LastName, Household = h.Name }).ToListAsync(cancellationToken);
        var signatures = await db.SlipSignatures.AsNoTracking()
            .Where(s => s.SlipId == slip.Id && s.Version == slip.Version && s.Status != SignatureStatus.Superseded)
            .ToListAsync(cancellationToken);
        return [.. children
            .OrderBy(c => c.FirstName).ThenBy(c => c.LastName)
            .Select(c =>
            {
                var s = signatures.Where(x => x.ChildId == c.Id).OrderByDescending(x => x.At).FirstOrDefault();
                return new SlipResponseDto(c.Id, $"{c.FirstName} {c.LastName}", c.Household, s?.Status.ToString() ?? "Outstanding", s?.SignedBy);
            })];
    }
}
