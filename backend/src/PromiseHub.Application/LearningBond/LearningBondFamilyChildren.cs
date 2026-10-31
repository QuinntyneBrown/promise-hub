using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// A household's children as its guardian sees them on the Learning Bond pages (L2-144 criteria 1 and 6): each child under 18 in a covered
/// program with the amount the rule estimates, and each child aged 18 to 20 with the self-claim rule; older children are not listed.
/// </summary>
public sealed class LearningBondFamilyChildren(IPromiseHubDb db, LearningBondCoverage coverage, TimeProvider clock)
{
    public async Task<IReadOnlyList<GuardianLearningBondChildDto>> ForAsync(Guid householdId, string timeZone, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(timeZone)).DateTime);
        var covered = (await coverage.CoveredAsync(cancellationToken)).FirstOrDefault(c => c.HouseholdId == householdId);
        var programIds = covered?.ProgramIds ?? [];
        var enrolled = await (from e in db.Enrollments.AsNoTracking()
                              join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                              where e.EndedAt == null && programIds.Contains(e.ProgramId)
                              select new { e.ChildId, p.Name }).ToListAsync(cancellationToken);
        var consents = await db.LearningBondConsents.AsNoTracking().Where(c => c.HouseholdId == householdId && c.Scope == LearningBondConsentScope.LearningBond
            && c.WithdrawnAt == null && c.ClosedAt == null).Select(c => c.Id).ToListAsync(cancellationToken);
        var claims = await db.LearningBondClaims.AsNoTracking().Where(c => c.HouseholdId == householdId && consents.Contains(c.ConsentId))
            .ToDictionaryAsync(c => c.ChildId, c => c.Status.ToString(), cancellationToken);
        var children = new List<GuardianLearningBondChildDto>();
        foreach (var child in (await db.Children.AsNoTracking().Where(c => c.HouseholdId == householdId).ToListAsync(cancellationToken))
                     .OrderBy(c => c.FirstName, StringComparer.CurrentCulture))
        {
            var age = child.AgeOn(today);
            var programs = enrolled.Where(e => e.ChildId == child.Id).Select(e => e.Name).Distinct().Order(StringComparer.CurrentCulture).ToList();
            if (age is >= 18 and < 21)
            {
                children.Add(new(child.Id, child.FirstName, age, programs, null, true));
            }
            else if (age is null or < 18 && programs.Count > 0)
            {
                children.Add(new(child.Id, child.FirstName, age, programs,
                    child.DateOfBirth is { } born ? LearningBondRule.Current.Estimate(born.Year, today.Year) : null, false, claims.GetValueOrDefault(child.Id)));
            }
        }
        return children;
    }
}
