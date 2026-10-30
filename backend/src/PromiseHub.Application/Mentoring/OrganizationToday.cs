using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>Today's date in the caller's organization's time zone, for mentor check-in dates and follow-ups (L2-090).</summary>
public sealed class OrganizationToday(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock)
{
    public async Task<DateOnly> GetAsync(CancellationToken cancellationToken = default) => DateOnly.FromDateTime((await NowAsync(cancellationToken)).DateTime);

    /// <summary>The time now in the organization's time zone, such as for a Learning Bond launch due at 10:00 local (ADR 0079).</summary>
    public async Task<DateTimeOffset> NowAsync(CancellationToken cancellationToken = default)
    {
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        return TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone);
    }
}
