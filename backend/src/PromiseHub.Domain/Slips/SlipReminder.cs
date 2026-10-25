using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Slips;

/// <summary>
/// A reminder recorded on a household for a slip: one per schedule slot, so the job never reminds twice for the same
/// slot. A household that cannot be reached is recorded as unreachable for staff to follow up (L2-016 criteria 1 and 4).
/// </summary>
public sealed class SlipReminder : ITenantOwned
{
    public SlipReminder(Guid id, Guid organizationId, Guid slipId, Guid householdId, ReminderKind kind, string slot, DateTimeOffset sentAt, bool unreachable)
    {
        Id = id;
        OrganizationId = organizationId;
        SlipId = slipId;
        HouseholdId = householdId;
        Kind = kind;
        Slot = slot;
        SentAt = sentAt;
        Unreachable = unreachable;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid SlipId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public ReminderKind Kind { get; private set; }

    /// <summary>The schedule slot ("2026-11-10T18:00") or a unique key for a manual reminder.</summary>
    public string Slot { get; private set; }

    public DateTimeOffset SentAt { get; private set; }
    public bool Unreachable { get; private set; }
}
