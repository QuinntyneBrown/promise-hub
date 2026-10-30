using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>An organization's acceptance of one agreement version, by a named member (L2-136 criterion 2). Turning Learning Bond on needs one for the current version.</summary>
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

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public int AgreementVersion { get; private set; }
    public Guid AcceptedByMembershipId { get; private set; }
    public string AcceptedByName { get; private set; }
    public DateTimeOffset AcceptedAt { get; private set; }
}
