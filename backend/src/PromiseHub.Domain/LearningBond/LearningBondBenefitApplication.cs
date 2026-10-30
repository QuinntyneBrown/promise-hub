using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// One benefit's application (L2-156): contact details for this application only, a review version every edit moves, and a submission key
/// written before the program's channel is called; a form the guardian sends is marked sent by the guardian.
/// </summary>
public sealed class LearningBondBenefitApplication : ITenantOwned
{
    public LearningBondBenefitApplication(Guid id, Guid organizationId, Guid householdId, string benefitKey, string ruleVersion, string? address, string? phone,
        string? email, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        BenefitKey = benefitKey;
        RuleVersion = ruleVersion;
        Address = address;
        Phone = phone;
        Email = email;
        ReviewVersion = 1;
        Status = address is null ? LearningBondBenefitApplicationStatus.Draft : LearningBondBenefitApplicationStatus.ReadyToSubmit;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public string BenefitKey { get; private set; }
    public string RuleVersion { get; private set; }
    public LearningBondBenefitApplicationStatus Status { get; private set; }
    public int ReviewVersion { get; private set; }
    public string? Address { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public Guid? SubmissionKey { get; private set; }
    public string? Reference { get; private set; }
    public DateTimeOffset? SubmittedAt { get; private set; }
    /// <summary>The first year's amount a program confirmed when the benefit started (L2-158 criterion 2).</summary>
    public int? ConfirmedAmount { get; private set; }

    public DateTimeOffset? StartedAt { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public bool Editable => Status is LearningBondBenefitApplicationStatus.Draft or LearningBondBenefitApplicationStatus.ReadyToSubmit;

    public bool Sent => Status is LearningBondBenefitApplicationStatus.Submitted or LearningBondBenefitApplicationStatus.MarkedSent;

    public void ChangePhone(string phone, DateTimeOffset now) => Change(() => Phone = phone, now);

    public void ChangeEmail(string email, DateTimeOffset now) => Change(() => Email = email, now);

    public void ChangeAddress(string address, DateTimeOffset now) => Change(() => Address = address, now);

    public Guid BeginSubmission() => SubmissionKey ??= Guid.NewGuid();

    public void MarkSubmitted(string? reference, DateTimeOffset now)
    {
        Status = LearningBondBenefitApplicationStatus.Submitted;
        Reference = reference;
        SubmittedAt = now;
        UpdatedAt = now;
    }

    /// <summary>The guardian sent the program's form themselves and says so (L2-156 criterion 2).</summary>
    public void MarkSentByGuardian(DateTimeOffset now)
    {
        Status = LearningBondBenefitApplicationStatus.MarkedSent;
        SubmittedAt ??= now;
        UpdatedAt = now;
    }

    public void MarkStarted(int amount, DateTimeOffset now)
    {
        ConfirmedAmount = amount;
        StartedAt ??= now;
        UpdatedAt = now;
    }

    private void Change(Action change, DateTimeOffset now)
    {
        change();
        ReviewVersion++;
        Status = Address is null ? LearningBondBenefitApplicationStatus.Draft : LearningBondBenefitApplicationStatus.ReadyToSubmit;
        UpdatedAt = now;
    }
}
