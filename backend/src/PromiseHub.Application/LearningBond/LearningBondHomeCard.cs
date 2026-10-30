using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// The guardian home's Learning Bond card (L2-144 criterion 7, L2-162): only with the module on, once the household has been invited and has
/// not said it isn't interested, and only for covered children under 18. Otherwise nothing, so the home never mentions it.
/// </summary>
public sealed class LearningBondHomeCard(IPromiseHubDb db, IModuleGate modules, LearningBondFamilyChildren families)
{
    public async Task<GuardianHomeLearningBondDto?> ForAsync(Guid householdId, string timeZone, CancellationToken cancellationToken = default)
    {
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return null;
        }
        var invitation = (await db.LearningBondInvitations.AsNoTracking().Where(i => i.HouseholdId == householdId).ToListAsync(cancellationToken))
            .OrderByDescending(i => i.SentAt).FirstOrDefault();
        if (invitation is null || invitation.DeclinedAt is not null)
        {
            return null;
        }
        var children = (await families.ForAsync(householdId, timeZone, cancellationToken)).Where(c => !c.SelfClaim && c.Amount is not null).ToList();
        if (children.Count == 0)
        {
            return null;
        }
        var claims = await db.LearningBondClaims.AsNoTracking().Where(c => c.HouseholdId == householdId).ToListAsync(cancellationToken);
        return new GuardianHomeLearningBondDto([.. children.Select(c => new GuardianHomeLearningBondChildDto(c.Id, c.FirstName,
            claims.Where(k => k.ChildId == c.Id).OrderByDescending(k => k.UpdatedAt).FirstOrDefault()?.Status.ToString() ?? "Invited"))]);
    }
}
