using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.LearningBond;

/// <summary>
/// A guardian's explicit consent for the financial module (L2-145): per child, with its scope, the typed name, the wording's version, the
/// language and the time. It shares nothing with any program consent and never counts as one, nor one as it.
/// </summary>
public sealed class LearningBondConsent : ITenantOwned
{
    public const int MaximumName = 200;

    public LearningBondConsent(Guid id, Guid organizationId, Guid householdId, Guid childId, LearningBondConsentScope scope, string typedName, int wordingVersion,
        string language, DateTimeOffset givenAt)
    {
        Id = id;
        OrganizationId = organizationId;
        HouseholdId = householdId;
        ChildId = childId;
        Scope = scope;
        TypedName = typedName;
        WordingVersion = wordingVersion;
        Language = language;
        GivenAt = givenAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Guid ChildId { get; private set; }
    public LearningBondConsentScope Scope { get; private set; }
    public string TypedName { get; private set; }
    public int WordingVersion { get; private set; }
    public string Language { get; private set; }
    public DateTimeOffset GivenAt { get; private set; }
    public DateTimeOffset? WithdrawnAt { get; private set; }

    /// <summary>When its claim closed as Not completed (L2-151 criterion 5): no longer in force, and reopening the link starts again.</summary>
    public DateTimeOffset? ClosedAt { get; private set; }

    public bool InForce => WithdrawnAt is null && ClosedAt is null;

    public void Close(DateTimeOffset now) => ClosedAt ??= now;
}
