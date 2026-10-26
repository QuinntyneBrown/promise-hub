namespace PromiseHub.Application.Billing;

/// <summary>
/// The organization's plan, its limits and this month's usage (`billing`). Status is Active, PaymentFailed (with
/// <see cref="GraceUntil"/>) or Suspended once the grace period has passed.
/// </summary>
public sealed record BillingDto(
    string Plan,
    int MonthlyPrice,
    int ChildLimit,
    int ActiveChildren,
    int SmsUsed,
    int SmsCap,
    string Status,
    DateTimeOffset? GraceUntil);
