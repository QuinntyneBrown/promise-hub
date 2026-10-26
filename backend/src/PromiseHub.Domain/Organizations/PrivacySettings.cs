namespace PromiseHub.Domain.Organizations;

/// <summary>
/// How long the organization keeps consent records (L2-030): 7 or 3 years after the event, or until deleted by request
/// (null). An organization without a row keeps them 7 years.
/// </summary>
public sealed class PrivacySettings : ITenantOwned
{
    public const int DefaultConsentRetentionYears = 7;
    public static readonly int[] ConsentRetentionChoices = [7, 3];

    public PrivacySettings(Guid id, Guid organizationId)
    {
        Id = id;
        OrganizationId = organizationId;
        ConsentRetentionYears = DefaultConsentRetentionYears;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public int? ConsentRetentionYears { get; private set; }

    public void Change(int? consentRetentionYears) => ConsentRetentionYears = consentRetentionYears;
}
