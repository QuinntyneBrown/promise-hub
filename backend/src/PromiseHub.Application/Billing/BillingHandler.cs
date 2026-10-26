using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Billing;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Billing;

/// <summary>Billing (L2-037): usage against the plan, changing plan with proration, and the payment grace period.</summary>
public sealed class BillingHandler(IPromiseHubDb db, ITenantContext tenant, PlanLimit limit, SmsCap sms, IAuditWriter audit, TimeProvider clock)
{
    public async Task<BillingDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var terms = PlanTerms.For(organization.Plan);
        var period = await sms.CurrentAsync(cancellationToken);
        var graceUntil = organization.PaymentFailedAt + PlanTerms.PaymentGrace;
        var status = graceUntil is null ? "Active" : clock.GetUtcNow() < graceUntil ? "PaymentFailed" : "Suspended";
        return new BillingDto(organization.Plan.ToString(), terms.MonthlyPrice, terms.ChildLimit, await limit.ActiveChildrenAsync(cancellationToken),
            period.Used, period.Cap, status, graceUntil);
    }

    public async Task<(Result Result, PlanChangedDto? Changed)> ChangeAsync(ChangePlanCommand command, CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        if (!Enum.TryParse<Plan>(command.Plan, out var plan) || !Enum.IsDefined(plan))
        {
            return (Invalid("Choose Free, Standard or Plus."), null);
        }
        if (plan == organization.Plan)
        {
            return (Invalid($"You’re already on {plan}."), null);
        }
        var terms = PlanTerms.For(plan);
        var active = await limit.ActiveChildrenAsync(cancellationToken);
        if (active > terms.ChildLimit)
        {
            return (Invalid($"{plan} covers {terms.ChildLimit} active children and you have {active}."), null);
        }
        var before = PlanTerms.For(organization.Plan);
        var proration = Proration(organization, before, terms);
        organization.ChangePlan(plan);
        if (await db.NotificationSettings.AllAsync(s => s.SmsCap == null, cancellationToken))
        {
            (await sms.CurrentAsync(cancellationToken)).ChangeCap(terms.SmsSegments);
        }
        audit.Record(new AuditEvent(AuditAction.Updated, "Billing", organization.Id, $"{before.Plan} to {plan} · {proration:0.00} prorated"));
        await db.SaveChangesAsync(cancellationToken);
        return (Result.Done, new PlanChangedDto(plan.ToString(), proration));
    }

    /// <summary>The price difference for the days left in the organization's month, today included; a downgrade is credited next month.</summary>
    private decimal Proration(Organization organization, PlanTerms before, PlanTerms after)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        var local = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone);
        var days = DateTime.DaysInMonth(local.Year, local.Month);
        var left = days - local.Day + 1;
        return Math.Max(0, Math.Round((after.MonthlyPrice - before.MonthlyPrice) * (decimal)left / days, 2));
    }

    private static Result Invalid(string message) => Result.Invalid(new Dictionary<string, string> { ["plan"] = message });
}
