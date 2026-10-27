using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Guardian;

/// <summary>
/// A guardian's consent for a youth (L2-055, ADR 0046): who signed with a typed name, how they are related, when, on which
/// device, in which language, the wording as shown and its hash, and a reference. In force until withdrawn; the record is
/// never deleted, and a consent after a withdrawal is a new row (L2-057).
/// </summary>
public sealed class GuardianConsent : ITenantOwned
{
    public GuardianConsent(Guid id, Guid organizationId, Guid childId, Guid householdId, Guid linkId, string signedBy, string relationship,
        string wording, string wordingHash, string language, string? device, string reference, DateTimeOffset signedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        ChildId = childId;
        HouseholdId = householdId;
        LinkId = linkId;
        SignedBy = signedBy;
        Relationship = relationship;
        Wording = wording;
        WordingHash = wordingHash;
        Language = language;
        Device = device;
        Reference = reference;
        SignedAt = signedAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ChildId { get; private set; }
    public Guid HouseholdId { get; private set; }

    /// <summary>The consent link it was signed through.</summary>
    public Guid LinkId { get; private set; }
    public string SignedBy { get; private set; }
    public string Relationship { get; private set; }
    public string Wording { get; private set; }
    public string WordingHash { get; private set; }
    public string Language { get; private set; }
    public string? Device { get; private set; }
    public string Reference { get; private set; }
    public DateTimeOffset SignedAt { get; private set; }
    public DateTimeOffset? WithdrawnAt { get; private set; }
    public string? WithdrawnBy { get; private set; }

    public bool InForce => WithdrawnAt is null;

    public void Withdraw(string by, DateTimeOffset now)
    {
        WithdrawnAt ??= now;
        WithdrawnBy ??= by;
    }
}
