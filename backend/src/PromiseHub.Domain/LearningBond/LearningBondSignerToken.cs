using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// Every single-use link issued for a signer request, kept only as its hash (L2-137 criterion 9). The request holds the current one; an
/// earlier link that Resend replaced still finds its organization here, so it can say whom to ask for a new one.
/// </summary>
public sealed class LearningBondSignerToken : ITenantOwned
{
    public LearningBondSignerToken(Guid id, Guid organizationId, Guid requestId, string tokenHash, DateTimeOffset issuedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        RequestId = requestId;
        TokenHash = tokenHash;
        IssuedAt = issuedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid RequestId { get; private set; }
    public string TokenHash { get; private set; }
    public DateTimeOffset IssuedAt { get; private set; }
}
