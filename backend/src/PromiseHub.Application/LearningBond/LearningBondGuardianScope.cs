using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Opens a Learning Bond guardian request (L2-144 criteria 2 and 5, L2-162): an unknown or revoked link has expired; with the module off
/// it is not found; a device not verified for the household gets the code step. Otherwise the request runs in the link's organization as
/// the guardian.
/// </summary>
public sealed class LearningBondGuardianScope(GuardianAccess access, TenantContext tenant, IModuleGate modules, IPromiseHubDb db)
{
    public async Task<(GuardianResult? Gate, GuardianScope? Scope)> TrustedAsync(GuardianRequest request, CancellationToken cancellationToken = default)
    {
        var scope = await access.ResolveAsync(request, cancellationToken);
        if (scope is null)
        {
            return (GuardianResult.Of(GuardianOutcome.Gone, GuardianAccess.GoneBody(null)), null);
        }
        tenant.ResolveForGuardian(scope.Organization.Id);
        if (!await modules.IsOnAsync(ModuleId.LearningBond, cancellationToken))
        {
            return (GuardianResult.Of(GuardianOutcome.NotFound), null);
        }
        if (!scope.Trusted)
        {
            var guardians = await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == scope.Household.Id).ToListAsync(cancellationToken);
            var contacts = guardians.Where(g => !string.IsNullOrWhiteSpace(g.Mobile)).Select(g => ContactMask.Phone(g.Mobile!))
                .Concat(guardians.Where(g => !string.IsNullOrWhiteSpace(g.Email) && !g.EmailBounced).Select(g => ContactMask.Email(g.Email!)));
            return (GuardianResult.Of(GuardianOutcome.VerificationRequired, GuardianAccess.VerifyBody(scope, contacts)), null);
        }
        return (null, scope);
    }
}
