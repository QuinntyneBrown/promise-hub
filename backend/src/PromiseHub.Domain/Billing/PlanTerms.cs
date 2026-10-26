using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Billing;

/// <summary>What each plan costs and allows (L2-037). SMS segments match <see cref="Messaging.SmsUsagePeriod.CapFor"/>.</summary>
public sealed record PlanTerms(Plan Plan, int MonthlyPrice, int ChildLimit, int SmsSegments)
{
    public static readonly TimeSpan PaymentGrace = TimeSpan.FromDays(14);

    public static PlanTerms For(Plan plan) => plan switch
    {
        Plan.Free => new(plan, 0, 50, 200),
        Plan.Standard => new(plan, 89, 500, 2000),
        _ => new(plan, 149, 2000, 5000),
    };
}
