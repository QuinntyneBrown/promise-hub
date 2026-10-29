namespace PromiseHub.Application.Website;

/// <summary>A hosted checkout the payment provider started: its reference and the address the visitor finishes at.</summary>
public sealed record PaymentCheckout(string Reference, string Url);
