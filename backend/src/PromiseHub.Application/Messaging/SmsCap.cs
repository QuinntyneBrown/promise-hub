using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Messaging;

namespace PromiseHub.Application.Messaging;

/// <summary>
/// The organization's monthly SMS segments (L2-022). Every text reserves its segments first; a refused reservation means the
/// cap is reached. The month is the organization's local month, so the counter starts again on the first.
/// </summary>
public sealed class SmsCap(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task<SmsUsagePeriod> CurrentAsync(CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        var period = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone).ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
        var current = await db.SmsUsagePeriods.FirstOrDefaultAsync(p => p.Period == period, cancellationToken);
        if (current is null)
        {
            current = new SmsUsagePeriod(Guid.NewGuid(), tenant.OrganizationId, period, SmsUsagePeriod.CapFor(organization.Plan));
            db.SmsUsagePeriods.Add(current);
        }
        return current;
    }
}
