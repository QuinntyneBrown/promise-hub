using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Resolves a signer's link (L2-137, ADR 0078): finds the request by the token's hash across organizations, then puts the request in that
/// organization's scope as the signer. Only hashes are stored, so the token itself is never read back, logged or audited. A link Resend
/// replaced is found among the request's issued links and has expired (criterion 9).
/// </summary>
public sealed class LearningBondSignerLinkAccess(IPromiseHubDb db, TenantContext tenant, TimeProvider clock)
{
    public async Task<LearningBondSignerLink> ResolveAsync(string token, CancellationToken cancellationToken = default)
    {
        var hash = GuardianTokens.Hash(token);
        var issued = await db.LearningBondSignerTokens.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        var request = issued is null
            ? null
            : await db.LearningBondSignerRequests.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.Id == issued.RequestId, cancellationToken);
        if (request is null)
        {
            return new(LearningBondSignerLinkStatus.Unknown, null, null);
        }
        tenant.ResolveForSigner(request.OrganizationId, request.Name);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == request.OrganizationId, cancellationToken);
        // A suspended organization's links stop working; nothing is deleted (L2-003).
        if (organization.SuspendedAt is not null || request.TokenHash != hash || !request.IsOpen(clock.GetUtcNow()))
        {
            return new(LearningBondSignerLinkStatus.Expired, null, organization.Name);
        }
        return new(LearningBondSignerLinkStatus.Open, request, organization.Name);
    }
}
