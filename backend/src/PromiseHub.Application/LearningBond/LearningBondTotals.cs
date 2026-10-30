using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A household's running total (L2-158), only ever from its own records: Learning Bond deposits and estimates by child, and each benefit
/// sent: its confirmed first year, or its estimate by the catalogue's rule, split by child where the rule is per child.
/// </summary>
public sealed class LearningBondTotals(IPromiseHubDb db, LearningBondBenefitsAccess access, TimeProvider clock)
{
    public async Task<IReadOnlyList<LearningBondTotalLineDto>> LinesAsync(Guid householdId, string timeZone, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(timeZone)).DateTime);
        var children = await db.Children.AsNoTracking().Where(c => c.HouseholdId == householdId).ToListAsync(cancellationToken);
        var names = children.ToDictionary(c => c.Id, c => c.FirstName);
        var lines = new List<LearningBondTotalLineDto>();
        var claims = await db.LearningBondClaims.AsNoTracking().Where(c => c.HouseholdId == householdId).ToListAsync(cancellationToken);
        foreach (var application in (await db.LearningBondApplications.AsNoTracking().Where(a => a.HouseholdId == householdId).ToListAsync(cancellationToken))
            .Where(a => a.SubmittedAt is not null).OrderBy(a => names.GetValueOrDefault(a.ChildId), StringComparer.CurrentCulture))
        {
            var child = names.GetValueOrDefault(application.ChildId);
            if (application.DepositAmount is { } deposited)
            {
                lines.Add(new(child, "Learning Bond", deposited, true));
            }
            else if (claims.FirstOrDefault(c => c.Id == application.ClaimId)?.EstimateAmount is { } estimate)
            {
                lines.Add(new(child, "Learning Bond", estimate, false));
            }
        }
        var answers = await access.AnswersAsync(householdId, cancellationToken);
        var claimable = children.Where(c => c.AgeOn(today) is null or < 18 && answers?.Custody.GetValueOrDefault(c.Id) is null or "Me" or "Shared")
            .OrderBy(c => c.FirstName, StringComparer.CurrentCulture).ToList();
        foreach (var application in (await db.LearningBondBenefitApplications.AsNoTracking().Where(a => a.HouseholdId == householdId).ToListAsync(cancellationToken))
            .Where(a => a.Sent).OrderBy(a => a.BenefitKey, StringComparer.Ordinal))
        {
            if (BenefitCatalogue.Named(application.BenefitKey) is not { } entry)
            {
                continue;
            }
            var shares = entry.Rule.PerChild is { } perChild && claimable.Count > 0
                ? claimable.Select(c => (c.FirstName, Amount: perChild(c.AgeOn(today) ?? 0))).ToList()
                : null;
            if (application.ConfirmedAmount is { } confirmed)
            {
                lines.AddRange(Split(entry.Name, confirmed, shares, true));
            }
            else if (shares is not null)
            {
                lines.AddRange(shares.Select(s => new LearningBondTotalLineDto(s.FirstName, entry.Name, s.Amount, false)));
            }
        }
        return lines;
    }

    /// <summary>A confirmed amount shared by child as the rule weighs them; the rounding goes to the first child.</summary>
    private static IEnumerable<LearningBondTotalLineDto> Split(string stream, int amount, List<(string FirstName, int Amount)>? shares, bool confirmed)
    {
        if (shares is null || shares.Sum(s => s.Amount) == 0)
        {
            return [new(null, stream, amount, confirmed)];
        }
        var weight = shares.Sum(s => s.Amount);
        var parts = shares.Select(s => (s.FirstName, Amount: amount * s.Amount / weight)).ToList();
        parts[0] = (parts[0].FirstName, parts[0].Amount + amount - parts.Sum(p => p.Amount));
        return parts.Select(p => new LearningBondTotalLineDto(p.FirstName, stream, p.Amount, confirmed));
    }
}
