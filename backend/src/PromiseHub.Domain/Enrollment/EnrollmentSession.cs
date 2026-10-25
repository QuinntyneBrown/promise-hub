using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Enrollment;

/// <summary>
/// A guardian enrolling through a program's link: the contact they verified with a code, the draft they are filling in,
/// and the device token (hashed) that lets them continue. Three wrong codes lock it for 15 minutes.
/// </summary>
public sealed class EnrollmentSession : ITenantOwned
{
    public EnrollmentSession(Guid id, Guid organizationId, Guid programId, string contact)
    {
        Id = id;
        OrganizationId = organizationId;
        ProgramId = programId;
        Contact = contact;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ProgramId { get; private set; }

    /// <summary>The phone digits or the lower-case email the guardian verified.</summary>
    public string Contact { get; private set; }

    public string? CodeHash { get; private set; }
    public DateTimeOffset? CodeExpiresAt { get; private set; }
    public int FailedCodes { get; private set; }
    public DateTimeOffset? LockedUntil { get; private set; }
    public string? TokenHash { get; private set; }
    public DateTimeOffset? VerifiedAt { get; private set; }

    /// <summary>The household this contact belongs to in this organization, when it is a returning family.</summary>
    public Guid? HouseholdId { get; private set; }

    public string? Draft { get; private set; }
    public DateTimeOffset? SubmittedAt { get; private set; }

    public void NewCode(string codeHash, DateTimeOffset expiresAt)
    {
        CodeHash = codeHash;
        CodeExpiresAt = expiresAt;
    }

    public bool IsLocked(DateTimeOffset now) => LockedUntil > now;

    /// <summary>Counts a wrong code; true when this one locks the session.</summary>
    public bool WrongCode(DateTimeOffset now)
    {
        if (++FailedCodes < 3)
        {
            return false;
        }
        FailedCodes = 0;
        LockedUntil = now.AddMinutes(15);
        return true;
    }

    public void Verified(string tokenHash, Guid? householdId, DateTimeOffset now)
    {
        TokenHash = tokenHash;
        HouseholdId = householdId;
        VerifiedAt = now;
        FailedCodes = 0;
        CodeHash = null;
    }

    public void SaveDraft(string draft) => Draft = draft;

    public void Submitted(Guid householdId, DateTimeOffset now)
    {
        HouseholdId = householdId;
        SubmittedAt = now;
    }
}
