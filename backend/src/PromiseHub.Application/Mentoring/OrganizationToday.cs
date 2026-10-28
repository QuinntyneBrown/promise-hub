using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>Today's date in the caller's organization's time zone, for mentor check-in dates and follow-ups (L2-090).</summary>
public sealed class OrganizationToday(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task<DateOnly> GetAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone).DateTime);
    }
}
