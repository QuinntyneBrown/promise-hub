using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A household's benefits check (L2-153, L2-154): whether Not now was chosen on the confirmation, and the answers to the benefits intake,
/// kept only as ciphertext under the Learning Bond key (L2-159).
/// </summary>
public sealed class LearningBondBenefitsCheck : ITenantOwned
{
    public LearningBondBenefitsCheck(Guid id, Guid organizationId, Guid householdId, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public DateTimeOffset? OfferDismissedAt { get; private set; }
    public string? AnswersCiphertext { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public void DismissOffer(DateTimeOffset now)
    {
        OfferDismissedAt ??= now;
        UpdatedAt = now;
    }

    public void SetAnswers(string ciphertext, DateTimeOffset now)
    {
        AnswersCiphertext = ciphertext;
        UpdatedAt = now;
    }
}
