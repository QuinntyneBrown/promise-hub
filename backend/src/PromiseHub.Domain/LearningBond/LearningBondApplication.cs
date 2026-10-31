using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A child's RESP and Learning Bond application (L2-148, L2-149): the provider, the province, the contact details for this application only
/// (the household record is never changed) and a review version that every edit moves, which Submit must quote.
/// </summary>
public sealed class LearningBondApplication : ITenantOwned
{
    public const int MaximumAddress = 200;

    public LearningBondApplication(Guid id, Guid organizationId, Guid householdId, Guid childId, Guid claimId, string province, string? provider, string? phone,
        string? email, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        ChildId = childId;
        ClaimId = claimId;
        Province = province;
        Provider = provider;
        Phone = phone;
        Email = email;
        Status = LearningBondApplicationStatus.Draft;
        ReviewVersion = 1;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid ClaimId { get; private set; }
    public LearningBondApplicationStatus Status { get; private set; }
    public string Province { get; private set; }
    public string? Provider { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? Address { get; private set; }
    public int ReviewVersion { get; private set; }

    /// <summary>Written before the provider's channel is called, so a repeat finds it and sends nothing (L2-149 criterion 3).</summary>
    public Guid? SubmissionKey { get; private set; }

    public string? ProviderReference { get; private set; }
    public DateTimeOffset? SubmittedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public bool Editable => Status is LearningBondApplicationStatus.Draft or LearningBondApplicationStatus.ReadyToSubmit;

    public void ChangePhone(string phone, DateTimeOffset now) => Change(() => Phone = phone, now);

    public void ChangeEmail(string email, DateTimeOffset now) => Change(() => Email = email, now);

    public void ChangeAddress(string address, DateTimeOffset now) => Change(() => Address = address, now);

    /// <summary>A new province keeps the provider only while it still serves there.</summary>
    public void ChangeProvince(string province, string? provider, DateTimeOffset now) => Change(() => (Province, Provider) = (province, provider), now);

    public void ChooseProvider(string provider, DateTimeOffset now) => Change(() => Provider = provider, now);

    /// <summary>The key a submission is sent under, written before the channel is called; a retry reuses it.</summary>
    public Guid BeginSubmission() => SubmissionKey ??= Guid.NewGuid();

    public void MarkSubmitted(string? reference, DateTimeOffset now)
    {
        Status = LearningBondApplicationStatus.Submitted;
        ProviderReference = reference;
        SubmittedAt = now;
        UpdatedAt = now;
    }

    private void Change(Action change, DateTimeOffset now)
    {
        change();
        ReviewVersion++;
        Status = Provider is not null && Address is not null ? LearningBondApplicationStatus.ReadyToSubmit : LearningBondApplicationStatus.Draft;
        UpdatedAt = now;
    }
}
