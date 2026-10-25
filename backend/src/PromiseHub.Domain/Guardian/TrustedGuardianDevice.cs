using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Guardian;

/// <summary>A device that verified a code for a household: its links open without a code for 30 days.</summary>
public sealed class TrustedGuardianDevice : ITenantOwned
{
    public TrustedGuardianDevice(Guid id, Guid organizationId, Guid householdId, string tokenHash, DateTimeOffset expiresAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string TokenHash { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }

    public void Revoke(DateTimeOffset now) => RevokedAt ??= now;
}
