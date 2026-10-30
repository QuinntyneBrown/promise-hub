using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A reminder on a date that matters to the household (L2-157): file the year's taxes, a child turning 6 or 18, or a benefit's renewal.
/// Sent once on its day; never once turned off; a day that passed unsent (the module off, say) is missed, never sent late.
/// </summary>
public sealed class LearningBondDateReminder : ITenantOwned
{
    public LearningBondDateReminder(Guid id, Guid organizationId, Guid householdId, LearningBondDateReminderKind kind, Guid? childId, string? benefitKey, DateOnly dueOn,
        DateOnly eventOn)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        Kind = kind;
        ChildId = childId;
        BenefitKey = benefitKey;
        DueOn = dueOn;
        EventOn = eventOn;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public LearningBondDateReminderKind Kind { get; private set; }
    public Guid? ChildId { get; private set; }
    public string? BenefitKey { get; private set; }

    /// <summary>The day it is sent: March 15, 30 days before a birthday, or the renewal date.</summary>
    public DateOnly DueOn { get; private set; }

    /// <summary>The day it is about: the filing deadline's year, the birthday, the renewal.</summary>
    public DateOnly EventOn { get; private set; }

    public DateTimeOffset? TurnedOffAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }
    public DateTimeOffset? MissedAt { get; private set; }

    public bool Ahead => TurnedOffAt is null && SentAt is null && MissedAt is null;

    public void TurnOff(DateTimeOffset now) => TurnedOffAt ??= now;

    public void MarkSent(DateTimeOffset now) => SentAt = now;

    public void MarkMissed(DateTimeOffset now) => MissedAt = now;
}
