using System.Collections.Concurrent;
using PromiseHub.Application.Website;

namespace PromiseHub.Api.Tests;

/// <summary>Answers a hosted checkout instead of calling a payment provider; set <see cref="Configured"/> false for an organization without one.</summary>
public sealed class FakePaymentProvider : IPaymentProvider
{
    private readonly ConcurrentQueue<(Guid OrganizationId, int MonthlyAmount, string Email)> _started = new();

    public bool Configured { get; set; } = true;

    public IReadOnlyList<(Guid OrganizationId, int MonthlyAmount, string Email)> Started => [.. _started];

    public Task<PaymentCheckout?> StartCheckoutAsync(Guid organizationId, int monthlyAmount, string email, CancellationToken cancellationToken)
    {
        if (!Configured)
        {
            return Task.FromResult<PaymentCheckout?>(null);
        }
        _started.Enqueue((organizationId, monthlyAmount, email));
        var reference = $"chk_{_started.Count:000}";
        return Task.FromResult<PaymentCheckout?>(new PaymentCheckout(reference, $"https://checkout.example/pay/{reference}"));
    }
}
