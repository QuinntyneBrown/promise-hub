using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.LearningBond;

namespace PromiseHub.Application.LearningBond;

/// <summary>A child's Learning Bond claim, only while that child's Learning Bond consent is in force (L2-145): every later step starts here.</summary>
public sealed class LearningBondClaimFinder(IPromiseHubDb db)
{
    public async Task<LearningBondClaim?> ForChildAsync(Guid householdId, Guid childId, bool tracked = false, CancellationToken cancellationToken = default)
    {
        var consents = await db.LearningBondConsents.AsNoTracking()
            .Where(c => c.HouseholdId == householdId && c.ChildId == childId && c.Scope == LearningBondConsentScope.LearningBond && c.WithdrawnAt == null && c.ClosedAt == null)
            .Select(c => c.Id).ToListAsync(cancellationToken);
        var query = tracked ? db.LearningBondClaims : db.LearningBondClaims.AsNoTracking();
        return await query.FirstOrDefaultAsync(c => c.HouseholdId == householdId && c.ChildId == childId && consents.Contains(c.ConsentId), cancellationToken);
    }
}
