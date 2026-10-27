using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Guardian;

/// <summary>
/// The consent gate (L2-056, L2-057, ADR 0046): reads the policy, the child and the consents on every call, so a new consent, a
/// withdrawal, a changed consent age or a corrected birthday takes effect on the next request.
/// </summary>
public sealed class ConsentGate(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task<ConsentStatus> StatusAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var policy = await db.ConsentPolicies.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        var age = policy?.ConsentAge ?? ConsentPolicy.DefaultConsentAge;
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        var youth = await db.Memberships.AsNoTracking()
            .AnyAsync(m => m.OrganizationId == tenant.OrganizationId && m.ChildId == childId && m.Role == Role.Youth && m.RemovedAt == null, cancellationToken);
        var childAge = child?.AgeOn(DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime));
        var consents = await db.GuardianConsents.AsNoTracking().Where(c => c.ChildId == childId).ToListAsync(cancellationToken);
        // The consent in force when there is one (at most one at a time), otherwise the latest withdrawn one.
        var latest = consents.FirstOrDefault(c => c.InForce) ?? consents.OrderByDescending(c => c.SignedAt).FirstOrDefault();
        return new ConsentStatus(child is not null && youth && (childAge is null || childAge < age), age, latest);
    }

    /// <summary>True when the membership is a youth whose linked child needs consent and has none in force.</summary>
    public async Task<bool> GatedAsync(Guid membershipId, CancellationToken cancellationToken = default) =>
        (await ForMembershipAsync(membershipId, cancellationToken))?.Gated ?? false;

    /// <summary>The consent status of a youth membership's linked child; null for any other membership.</summary>
    public async Task<ConsentStatus?> ForMembershipAsync(Guid membershipId, CancellationToken cancellationToken = default)
    {
        var membership = await db.Memberships.AsNoTracking().Where(m => m.Id == membershipId).Select(m => new { m.Role, m.ChildId }).FirstOrDefaultAsync(cancellationToken);
        return membership is { Role: Role.Youth, ChildId: { } childId } ? await StatusAsync(childId, cancellationToken) : null;
    }
}
