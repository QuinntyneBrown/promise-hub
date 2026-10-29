namespace PromiseHub.Application.Website;

/// <summary>Where the visitor finishes the donation with the payment provider (L2-134 criterion 3).</summary>
public sealed record DonationCheckoutDto(string CheckoutUrl);
