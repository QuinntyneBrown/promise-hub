namespace PromiseHub.Application.Website;

/// <summary>
/// The payment provider that takes a monthly gift (L2-134 criterion 3, ADR 0075): answers a hosted checkout, or null when the organization
/// has no provider set up. Card details go to the provider only, never through PromiseHub.
/// </summary>
public interface IPaymentProvider
{
    Task<PaymentCheckout?> StartCheckoutAsync(Guid organizationId, int monthlyAmount, string email, CancellationToken cancellationToken);
}
