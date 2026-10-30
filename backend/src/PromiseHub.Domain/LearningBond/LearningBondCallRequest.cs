using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A guardian's request for a call about Learning Bond (L2-142 criteria 3 and 4): the number and time of day they gave, until a staff member
/// marks the call done with its outcome. The household's status reads it; nothing about the claim is in it.
/// </summary>
public sealed class LearningBondCallRequest : ITenantOwned
{
    public const int MaximumPhone = 30;

    public LearningBondCallRequest(Guid id, Guid organizationId, Guid householdId, string? guardian, string phone, LearningBondCallTime when, DateTimeOffset requestedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        Guardian = guardian;
        Phone = phone;
        When = when;
        RequestedAt = requestedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string? Guardian { get; private set; }
    public string Phone { get; private set; }
    public LearningBondCallTime When { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public DateTimeOffset? DoneAt { get; private set; }
    public LearningBondCallOutcome? Outcome { get; private set; }
    public string? DoneBy { get; private set; }

    public bool IsOpen => DoneAt is null;

    public void Done(LearningBondCallOutcome outcome, string by, DateTimeOffset now)
    {
        Outcome = outcome;
        DoneBy = by;
        DoneAt = now;
    }
}
