namespace PromiseHub.Application.Billing;

/// <summary>The new plan and what it adds to this month's invoice for the days left.</summary>
public sealed record PlanChangedDto(string Plan, decimal ProratedCharge);
