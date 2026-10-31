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

    /// <summary>The child's SIN, kept only as ciphertext under a key outside the database, and its last three digits (L2-159).</summary>
    public string? ChildSinCiphertext { get; private set; }

    public string? ChildSinLast3 { get; private set; }

    public LearningBondPausedReason? PausedReason { get; private set; }

    public EncryptedSin? ChildSin => ChildSinLast3 is null ? null : new EncryptedSin(ChildSinCiphertext, ChildSinLast3);

    public void SetChildSin(EncryptedSin sin, DateTimeOffset now)
    {
        ChildSinCiphertext = sin.Ciphertext;
        ChildSinLast3 = sin.Last3;
        UpdatedAt = now;
    }

    /// <summary>The "up to" amount last shown and the version of the rule that computed it (L2-147 criterion 5).</summary>
    public int? EstimateAmount { get; private set; }

    public int? RuleVersion { get; private set; }

    public void RecordEstimate(int? amount, int ruleVersion, DateTimeOffset now)
    {
        EstimateAmount = amount;
        RuleVersion = ruleVersion;
        UpdatedAt = now;
    }

    public void MarkSubmitted(DateTimeOffset now)
    {
        Status = LearningBondClaimStatus.Submitted;
        PausedReason = null;
        UpdatedAt = now;
    }

    public void MarkDeposited(DateTimeOffset now)
    {
        Status = LearningBondClaimStatus.Deposited;
        UpdatedAt = now;
    }

    /// <summary>When it paused, for the 180-day close (L2-151 criterion 5).</summary>
    public DateTimeOffset? PausedAt { get; private set; }

    /// <summary>The claim goes on from where it stopped, every answer kept (L2-151 criterion 4).</summary>
    public void Resume(DateTimeOffset now)
    {
        Status = LearningBondClaimStatus.Started;
        PausedReason = null;
        PausedAt = null;
        UpdatedAt = now;
    }

    /// <summary>Closed after 180 idle days: Not completed, the child's SIN destroyed and its last three digits kept (L2-151 criterion 5, L2-159).</summary>
    public void Close(DateTimeOffset now)
    {
        Status = LearningBondClaimStatus.NotCompleted;
        PausedReason = null;
        ChildSinCiphertext = null;
        UpdatedAt = now;
    }

    /// <summary>
    /// Consent withdrawn (L2-152): the child's SIN is destroyed; a claim already sent keeps its status, provider and dates, any other ends as
    /// Not completed.
    /// </summary>
    public void Withdraw(DateTimeOffset now)
    {
        ChildSinCiphertext = null;
        PausedReason = null;
        PausedAt = null;
        if (Status is not (LearningBondClaimStatus.Submitted or LearningBondClaimStatus.Deposited))
        {
            Status = LearningBondClaimStatus.NotCompleted;
        }
        UpdatedAt = now;
    }

    public void Pause(LearningBondPausedReason reason, DateTimeOffset now)
    {
        Status = LearningBondClaimStatus.Paused;
        PausedReason = reason;
        PausedAt = now;
        UpdatedAt = now;
    }
}
