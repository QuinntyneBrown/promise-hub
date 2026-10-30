using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// An organization's acceptance of one agreement version (L2-136 criterion 2): by a member, or by a named signer through an emailed link,
/// who has no membership and is recorded by name, title and email instead (L2-137 criterion 2). Turning Learning Bond on needs one for the
/// current version.
/// </summary>
public sealed class LearningBondAgreementAcceptance : ITenantOwned
{
    public LearningBondAgreementAcceptance(Guid id, Guid organizationId, int agreementVersion, Guid acceptedByMembershipId, string acceptedByName, DateTimeOffset acceptedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        AgreementVersion = agreementVersion;
        AcceptedByMembershipId = acceptedByMembershipId;
        AcceptedByName = acceptedByName;
        AcceptedAt = acceptedAt;
    }

    private LearningBondAgreementAcceptance(Guid id, Guid organizationId, int agreementVersion, string acceptedByName, string signerTitle, string signerEmail,
        DateTimeOffset acceptedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        AgreementVersion = agreementVersion;
        AcceptedByName = acceptedByName;
        SignerTitle = signerTitle;
        SignerEmail = signerEmail;
        AcceptedAt = acceptedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public int AgreementVersion { get; private set; }
    /// <summary>The member who accepted; null when a named signer did.</summary>
    public Guid? AcceptedByMembershipId { get; private set; }
    public string AcceptedByName { get; private set; }
    /// <summary>The named signer's role or title; null when a member accepted.</summary>
    public string? SignerTitle { get; private set; }
    /// <summary>The named signer's email; null when a member accepted.</summary>
    public string? SignerEmail { get; private set; }
    public DateTimeOffset AcceptedAt { get; private set; }

    /// <summary>The named signer's acceptance through the single-use link of <paramref name="request"/>.</summary>
    public static LearningBondAgreementAcceptance BySigner(Guid id, LearningBondSignerRequest request, int agreementVersion, DateTimeOffset acceptedAt) =>
        new(id, request.OrganizationId, agreementVersion, request.Name, request.Title, request.Email, acceptedAt);
}
