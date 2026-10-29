namespace PromiseHub.Application.Website;

/// <summary>What Give monthly sends (L2-134 criterion 3): the amount in dollars a month, the donor's name and an email for the receipt.</summary>
public sealed record DonationRequest(int? MonthlyAmount, string? Name, string? Email);
