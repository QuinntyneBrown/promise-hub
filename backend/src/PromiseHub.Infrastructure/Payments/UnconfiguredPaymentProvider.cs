using PromiseHub.Application.Website;

namespace PromiseHub.Infrastructure.Payments;

/// <summary>
/// The payment provider until an organization has a real one (ADR 0075): there is none, so every checkout answers null and the public
/// website says online giving isn't available yet. A real provider replaces this registration; nothing is stored meanwhile.
/// </summary>
public sealed class UnconfiguredPaymentProvider : IPaymentProvider
{
    public Task<PaymentCheckout?> StartCheckoutAsync(Guid organizationId, int monthlyAmount, string email, CancellationToken cancellationToken) =>
        Task.FromResult<PaymentCheckout?>(null);
}
