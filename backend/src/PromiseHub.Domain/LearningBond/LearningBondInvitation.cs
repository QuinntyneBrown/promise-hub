using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// One household's Learning Bond invitation (L2-140, ADR 0079): written in the same save as its message, so a retry never invites twice;
/// the 7-day rule and "Invited {date}" read it.
/// </summary>
public sealed class LearningBondInvitation : ITenantOwned
{
    /// <summary>A household is not invited again within this time (L2-140 criterion 5).</summary>
    public static readonly TimeSpan Interval = TimeSpan.FromDays(7);

    public LearningBondInvitation(Guid id, Guid organizationId, Guid householdId, Guid messageId, LearningBondLaunchMode how, DateTimeOffset sentAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        MessageId = messageId;
        How = how;
        SentAt = sentAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Guid MessageId { get; private set; }
    public LearningBondLaunchMode How { get; private set; }
    public DateTimeOffset SentAt { get; private set; }
}
