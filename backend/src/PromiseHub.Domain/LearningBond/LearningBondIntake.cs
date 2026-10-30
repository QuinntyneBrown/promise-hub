using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A household's Learning Bond intake (ADR 0076): asked once and reused for every child. Prompt 82 holds only the guardian's SIN, stored as
/// <see cref="EncryptedSin"/> columns; the claim adds the remaining answers.
/// </summary>
public sealed class LearningBondIntake : ITenantOwned
{
    public LearningBondIntake(Guid id, Guid organizationId, Guid householdId, DateTimeOffset createdAt)
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
    public string? GuardianSinCiphertext { get; private set; }
    public string? GuardianSinLast3 { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? GuardianSinDestroyedAt { get; private set; }

    /// <summary>The household's answer about last year's tax return, asked once for every child (L2-146 criteria 2 and 5).</summary>
    public LearningBondTaxFiled? TaxFiled { get; private set; }

    public EncryptedSin? GuardianSin => GuardianSinLast3 is null ? null : new EncryptedSin(GuardianSinCiphertext, GuardianSinLast3);

    public void SetGuardianSin(EncryptedSin sin, DateTimeOffset now)
    {
        GuardianSinCiphertext = sin.Ciphertext;
        GuardianSinLast3 = sin.Last3;
        GuardianSinDestroyedAt = null;
        UpdatedAt = now;
    }

    public void SetTaxFiled(LearningBondTaxFiled answer, DateTimeOffset now)
    {
        TaxFiled = answer;
        UpdatedAt = now;
    }

    /// <summary>Destroys the ciphertext and keeps the last three digits (L2-159 criterion 4). False when there was nothing to destroy.</summary>
    public bool DestroyGuardianSin(DateTimeOffset now)
    {
        if (GuardianSin is not { IsDestroyed: false } sin)
        {
            return false;
        }
        GuardianSinCiphertext = sin.Destroy().Ciphertext;
        GuardianSinDestroyedAt = now;
        UpdatedAt = now;
        return true;
    }
}
