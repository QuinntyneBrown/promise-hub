namespace PromiseHub.Application.Guardian;

/// <summary>A withdrawal; the name, when given and matching a guardian of the household, is recorded as who withdrew.</summary>
public sealed record WithdrawConsentRequest(string? Name);
