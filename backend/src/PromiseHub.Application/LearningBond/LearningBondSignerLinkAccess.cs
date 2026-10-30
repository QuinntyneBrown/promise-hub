using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Resolves a signer's link (L2-137, ADR 0078): finds the request by the token's hash across organizations, then puts the request in that
/// organization's scope as the signer. Only the hash is stored, so the token itself is never read back, logged or audited.
/// </summary>
public sealed class LearningBondSignerLinkAccess(IPromiseHubDb db, TenantContext tenant, TimeProvider clock)
{
    public async Task<LearningBondSignerLink> ResolveAsync(string token, CancellationToken cancellationToken = default)
    {
        var hash = GuardianTokens.Hash(token);
        var request = await db.LearningBondSignerRequests.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.TokenHash == hash, cancellationToken);
        if (request is null)
        {
            return new(LearningBondSignerLinkStatus.Unknown, null, null);
        }
        tenant.ResolveForSigner(request.OrganizationId, request.Name);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == request.OrganizationId, cancellationToken);
        // A suspended organization's links stop working; nothing is deleted (L2-003).
        if (organization.SuspendedAt is not null || !request.IsOpen(clock.GetUtcNow()))
        {
            return new(LearningBondSignerLinkStatus.Expired, null, organization.Name);
        }
        return new(LearningBondSignerLinkStatus.Open, request, organization.Name);
    }
}
