using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>One child's Learning Bond claim, started by the guardian's consent for that child (L2-145). Later steps add their answers to it.</summary>
public sealed class LearningBondClaim : ITenantOwned
{
    public LearningBondClaim(Guid id, Guid organizationId, Guid householdId, Guid childId, Guid consentId, DateTimeOffset startedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        ChildId = childId;
        ConsentId = consentId;
        Status = LearningBondClaimStatus.Started;
        StartedAt = startedAt;
        UpdatedAt = startedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid ConsentId { get; private set; }
    public LearningBondClaimStatus Status { get; private set; }
    public DateTimeOffset StartedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
}
