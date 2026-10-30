using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Mentoring;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Launch (L2-140, ADR 0079): how the covered households can be reached, and the households to collect a contact from. A household is
/// reached by text when a guardian has a mobile number, by email when none has a mobile but one has an email that hasn't bounced.
/// </summary>
public sealed class LearningBondLaunchHandler(IPromiseHubDb db, LearningBondCoverage coverage, LearningBondAgreementGate gate, OrganizationToday today)
{
    public const int LatestDays = 90;

    public async Task<LearningBondLaunchDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var reach = await ReachAsync(cancellationToken);
        var programs = reach.SelectMany(r => r.Programs).Distinct().Order(StringComparer.CurrentCulture).ToList();
        var on = await today.GetAsync(cancellationToken);
        var mobile = reach.Count(r => r.Reach == Reach.Mobile);
        return new LearningBondLaunchDto(reach.Count, mobile, reach.Count(r => r.Reach == Reach.EmailOnly), reach.Count(r => r.Reach == Reach.Neither), programs,
            mobile == 0, null, null, null, on.AddDays(1), on.AddDays(LatestDays),
            await gate.IsAcceptedAsync(cancellationToken) ? null : LearningBondOverviewHandler.NewVersionMessage);
    }

    public async Task<LearningBondMissingContactsDto> MissingContactsAsync(CancellationToken cancellationToken = default)
    {
        var reach = await ReachAsync(cancellationToken);
        var neither = reach.Where(r => r.Reach == Reach.Neither).ToList();
        var ids = neither.Select(r => r.HouseholdId).ToList();
        var names = await db.Households.AsNoTracking().Where(h => ids.Contains(h.Id)).ToDictionaryAsync(h => h.Id, h => h.Name, cancellationToken);
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        return new([.. neither.Select(r => new LearningBondMissingContactDto(r.HouseholdId, names[r.HouseholdId],
            guardians.Where(g => g.HouseholdId == r.HouseholdId).OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name, StringComparer.CurrentCulture).FirstOrDefault()?.Name,
            string.Join(", ", r.Programs)))]);
    }

    /// <summary>Each covered household, the programs that cover it, and how it can be reached.</summary>
    private async Task<List<(Guid HouseholdId, IReadOnlyList<string> Programs, Reach Reach)>> ReachAsync(CancellationToken cancellationToken)
    {
        var covered = await coverage.CoveredAsync(cancellationToken);
        var ids = covered.Select(c => c.HouseholdId).ToList();
        var guardians = await db.Guardians.AsNoTracking().Where(g => ids.Contains(g.HouseholdId)).ToListAsync(cancellationToken);
        return [.. covered.Select(c => (c.HouseholdId, c.Programs, ReachOf(guardians.Where(g => g.HouseholdId == c.HouseholdId))))];
    }

    private static Reach ReachOf(IEnumerable<Domain.Households.Guardian> guardians)
    {
        var list = guardians.ToList();
        if (list.Any(g => !string.IsNullOrWhiteSpace(g.Mobile)))
        {
            return Reach.Mobile;
        }
        return list.Any(g => !string.IsNullOrWhiteSpace(g.Email) && !g.EmailBounced) ? Reach.EmailOnly : Reach.Neither;
    }

    private enum Reach
    {
        Mobile,
        EmailOnly,
        Neither,
    }
}
