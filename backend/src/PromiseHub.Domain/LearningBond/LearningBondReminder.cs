using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>A text to pick a paused claim back up (L2-151 criterion 3): due 14 and 30 days after the guardian asked, each sent once.</summary>
public sealed class LearningBondReminder : ITenantOwned
{
    public static readonly int[] Days = [14, 30];

    public LearningBondReminder(Guid id, Guid organizationId, Guid householdId, Guid claimId, DateTimeOffset dueAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        ClaimId = claimId;
        DueAt = dueAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Guid ClaimId { get; private set; }
    public DateTimeOffset DueAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }

    public bool Open => SentAt is null && CancelledAt is null;

    public void MarkSent(DateTimeOffset now) => SentAt = now;

    public void Cancel(DateTimeOffset now) => CancelledAt ??= now;
}
