using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// Resolves a guardian link to its household and organization and puts the request in that organization's scope; the
/// tenant comes from the link, never from the URL's other parts or the body (L2-001, L2-026).
/// </summary>
public sealed class GuardianAccess(IPromiseHubDb db, TenantContext tenant, TimeProvider clock)
{
    public async Task<GuardianScope?> ResolveAsync(GuardianRequest request, CancellationToken cancellationToken)
    {
        var hash = GuardianTokens.Hash(request.Token);
        var link = await db.GuardianLinks.IgnoreQueryFilters().FirstOrDefaultAsync(l => l.TokenHash == hash, cancellationToken);
        if (link is null || link.RevokedAt is not null)
        {
            return null;
        }
        tenant.ResolveForJob(link.OrganizationId);
        var household = await db.Households.FirstOrDefaultAsync(h => h.Id == link.HouseholdId, cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == link.OrganizationId, cancellationToken);
        if (household is null)
        {
            return null;
        }
        var now = clock.GetUtcNow();
        var trusted = false;
        if (request.DeviceToken is { Length: > 0 } device)
        {
            var deviceHash = GuardianTokens.Hash(device);
            trusted = (await db.TrustedGuardianDevices.Where(d => d.HouseholdId == household.Id && d.TokenHash == deviceHash && d.RevokedAt == null)
                .Select(d => d.ExpiresAt).ToListAsync(cancellationToken)).Any(e => e > now);
        }
        return new GuardianScope(link, household, organization, trusted);
    }

    /// <summary>A link stops working a month after its slip's sign-by date.</summary>
    public static bool Expired(PermissionSlip slip, DateTimeOffset now) =>
        DateOnly.FromDateTime(now.UtcDateTime) > slip.SignBy.AddDays(30);

    public static object GoneBody(Domain.Organizations.Organization? organization) =>
        new { code = "link-expired", organization = organization?.Name, phone = organization?.Phone };

    public static object VerifyBody(GuardianScope scope, IEnumerable<string> contacts) =>
        new { code = "verification-required", language = GuardianLanguage.Code(scope.Household.Language), organization = scope.Organization.Name, phone = scope.Organization.Phone, contacts };
}
