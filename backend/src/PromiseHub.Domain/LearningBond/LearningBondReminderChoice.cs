using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>The guardian's answer to "Remind you in 14 days?" for a paused claim (L2-151 criterion 3): kept so the page shows it.</summary>
public sealed class LearningBondReminderChoice : ITenantOwned
{
    public LearningBondReminderChoice(Guid id, Guid organizationId, Guid claimId, bool remind, DateTimeOffset chosenAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ClaimId = claimId;
        Remind = remind;
        ChosenAt = chosenAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ClaimId { get; private set; }
    public bool Remind { get; private set; }
    public DateTimeOffset ChosenAt { get; private set; }
}
