using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The dashboard's figures, computed on read over the tenant's covered households (L2-141, ADR 0084): households invited, started (a
/// Learning Bond claim) and completed (an application sent), children with a submitted Learning Bond application, and dollars estimated
/// (Learning Bond estimates of what was submitted, the benefits' annual estimates) and confirmed (deposits, benefits started). Suppression
/// below 5 households is applied here too, the same for the page and the export.
/// </summary>
public sealed class LearningBondFigures(IPromiseHubDb db, LearningBondCoverage coverage, LearningBondTotals totals)
{
    public const int Smallest = 5;

    public async Task<LearningBondFigureSet> ComputeAsync(IReadOnlyCollection<Guid>? programIds, DateTimeOffset? since, string timeZone, CancellationToken cancellationToken)
    {
        var covered = (await coverage.CoveredAsync(cancellationToken)).Where(h => programIds is null || h.ProgramIds.Any(programIds.Contains))
            .Select(h => h.HouseholdId).ToList();
        bool Recent(DateTimeOffset? at) => at is not null && (since is null || at >= since);
        var invited = (await db.LearningBondInvitations.AsNoTracking().Where(i => covered.Contains(i.HouseholdId)).Select(i => new { i.HouseholdId, i.SentAt })
            .ToListAsync(cancellationToken)).Where(i => Recent(i.SentAt)).Select(i => i.HouseholdId).Distinct().Count();
        var claims = await db.LearningBondClaims.AsNoTracking().Where(c => covered.Contains(c.HouseholdId)).ToListAsync(cancellationToken);
        var started = claims.Where(c => Recent(c.StartedAt)).Select(c => c.HouseholdId).Distinct().Count();
        var applications = (await db.LearningBondApplications.AsNoTracking().Where(a => covered.Contains(a.HouseholdId)).ToListAsync(cancellationToken))
            .Where(a => Recent(a.SubmittedAt)).ToList();
        var benefits = (await db.LearningBondBenefitApplications.AsNoTracking().Where(a => covered.Contains(a.HouseholdId)).ToListAsync(cancellationToken))
            .Where(a => a.Sent && Recent(a.SubmittedAt)).ToList();
        var completed = applications.Select(a => a.HouseholdId).Concat(benefits.Select(b => b.HouseholdId)).Distinct().Count();
        var estimatedLearningBond = applications.Sum(a => claims.FirstOrDefault(c => c.Id == a.ClaimId)?.EstimateAmount ?? 0);
        var confirmedLearningBond = applications.Sum(a => a.DepositAmount ?? 0);
        var estimatedBenefits = 0;
        foreach (var household in benefits.Select(b => b.HouseholdId).Distinct())
        {
            // A benefit's annual estimate by the catalogue's rule; once started, the amount the program confirmed stands in for it.
            var sent = benefits.Where(b => b.HouseholdId == household).Select(b => BenefitCatalogue.Named(b.BenefitKey)?.Name).ToHashSet();
            estimatedBenefits += (await totals.LinesAsync(household, timeZone, cancellationToken)).Where(l => sent.Contains(l.Stream)).Sum(l => l.Amount);
        }
        return new LearningBondFigureSet(invited, started, completed, applications.Select(a => a.ChildId).Distinct().Count(), estimatedLearningBond, estimatedBenefits,
            confirmedLearningBond, benefits.Sum(b => b.ConfirmedAmount ?? 0));
    }

    /// <summary>A count as shown: 0, "FewerThan5" from 1 to 4, or the number (L2-141 criterion 3).</summary>
    public static string Count(int count) =>
        count is > 0 and < Smallest ? "FewerThan5" : count.ToString(System.Globalization.CultureInfo.InvariantCulture);

    /// <summary>Dollars rest on the households that started; fewer than 5 and they are suppressed.</summary>
    public static bool Suppressed(LearningBondFigureSet set) => set.Started is > 0 and < Smallest || set.Completed is > 0 and < Smallest;

    public static LearningBondFiguresDto Dto(string? program, LearningBondFigureSet set) => new(program, Count(set.Invited), Count(set.Started), Count(set.Completed),
        Count(set.Children),
        Suppressed(set) ? null : new LearningBondDollarsDto(set.EstimatedLearningBond + set.EstimatedBenefits, set.EstimatedLearningBond, set.EstimatedBenefits),
        Suppressed(set) ? null : new LearningBondDollarsDto(set.ConfirmedLearningBond + set.ConfirmedBenefits, set.ConfirmedLearningBond, set.ConfirmedBenefits));
}
