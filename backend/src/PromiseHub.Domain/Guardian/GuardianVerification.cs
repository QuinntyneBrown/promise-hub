using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Guardian;

/// <summary>A six-digit code sent to a contact on file; its hash is stored and it expires after 10 minutes.</summary>
public sealed class GuardianVerification : ITenantOwned
{
    public GuardianVerification(Guid id, Guid organizationId, Guid linkId, string codeHash, DateTimeOffset expiresAt)
    {
        Id = id;
        OrganizationId = organizationId;
        LinkId = linkId;
        CodeHash = codeHash;
        ExpiresAt = expiresAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid LinkId { get; private set; }
    public string CodeHash { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? UsedAt { get; private set; }

    public void Use(DateTimeOffset now) => UsedAt = now;
}
