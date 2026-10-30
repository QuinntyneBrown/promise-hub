using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// One message of a household's conversation with the Learning Bond agent (L2-160 criterion 6): the guardian's (any SIN removed) or the
/// agent's. Read by the household only; no staff route reads it.
/// </summary>
public sealed class LearningBondAgentMessage : ITenantOwned
{
    public const int MaximumText = 2000;

    public LearningBondAgentMessage(Guid id, Guid organizationId, Guid householdId, string step, string role, string text, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        Step = step;
        Role = role;
        Text = text;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string Step { get; private set; }

    /// <summary>"Guardian" or "Agent".</summary>
    public string Role { get; private set; }

    public string Text { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
