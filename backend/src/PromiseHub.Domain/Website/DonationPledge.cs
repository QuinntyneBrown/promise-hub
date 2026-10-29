using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Website;

/// <summary>
/// A monthly donation a visitor started on an organization's public website (L2-134 criterion 3, ADR 0075): the amount, who and the payment
/// provider's reference only. The provider takes the card; PromiseHub never sees or stores card details.
/// </summary>
public sealed class DonationPledge : ITenantOwned
{
    public const int MaximumReference = 200;

    public DonationPledge(Guid id, Guid organizationId, int monthlyAmount, string name, string email, string providerReference, DateTimeOffset createdAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MonthlyAmount = monthlyAmount;
        Name = name;
        Email = email;
        ProviderReference = providerReference;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }

    /// <summary>Dollars a month: 20, 50 or 100.</summary>
    public int MonthlyAmount { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string ProviderReference { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
