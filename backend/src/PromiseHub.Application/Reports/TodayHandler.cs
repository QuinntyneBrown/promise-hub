using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Application.Slips;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Enrollment;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Incidents;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Reports;

/// <summary>
/// Today's summary, composed only from the modules that are on and the work the caller's role may do (L2-038 criterion 6).
/// Tonight's sessions come from <c>/sessions/today</c> with Roll Call.
/// </summary>
public sealed class TodayHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, TimeProvider clock, SlipReader slips)
{
    private const int ComingUpDays = 14;

    public async Task<TodayDto> HandleAsync(CancellationToken cancellationToken = default)
    {
        var on = await modules.OnAsync(cancellationToken);
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        var local = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone);
        var dayStart = new DateTimeOffset(local.Date, zone.GetUtcOffset(local.Date));
        var tomorrow = dayStart.AddDays(1);
        var today = DateOnly.FromDateTime(local.Date);

        var activeChildren = await db.Enrollments.AsNoTracking().Where(e => e.EndedAt == null).Select(e => e.ChildId).Distinct().CountAsync(cancellationToken);
        var households = await db.Households.CountAsync(cancellationToken);
        var events = (await db.Events.AsNoTracking().Where(e => e.Status == EventStatus.Scheduled).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt >= tomorrow && e.StartsAt < tomorrow.AddDays(ComingUpDays))
            .OrderBy(e => e.StartsAt)
            .ToList();

        List<TodaySlipDto>? slipsDue = null;
        if (on.Contains(ModuleId.Slips))
        {
            slipsDue = [];
            var allEvents = await db.Events.AsNoTracking().ToDictionaryAsync(e => e.Id, cancellationToken);
            var sent = await db.PermissionSlips.AsNoTracking().Where(s => s.Status == SlipStatus.Sent).ToListAsync(cancellationToken);
            foreach (var slip in sent.Where(s => s.SignBy >= today && allEvents.ContainsKey(s.EventId)).OrderBy(s => s.SignBy))
            {
                var e = allEvents[slip.EventId];
                var responses = await slips.ResponsesAsync(slip, e.ProgramId, cancellationToken);
                var signed = responses.Count(r => r.Status == "Signed");
                slipsDue.Add(new TodaySlipDto(e.Id, string.IsNullOrEmpty(slip.Title) ? e.Name : slip.Title, slip.SignBy, signed, responses.Count, responses.Count - signed));
            }
        }

        var tasks = new List<TodayTaskDto>();
        if (on.Contains(ModuleId.Incidents) && RolePermissions.Has(tenant.Role, Permission.ReviewIncidents))
        {
            tasks.Add(new("incidents", await db.Incidents.CountAsync(i => i.Status == IncidentStatus.NeedsReview, cancellationToken)));
        }
        if (RolePermissions.Has(tenant.Role, Permission.ReviewEnrollments))
        {
            tasks.Add(new("enrollments", await db.EnrollmentRequests.CountAsync(r => r.Status == EnrollmentRequestStatus.WaitingReview, cancellationToken)));
        }
        if (on.Contains(ModuleId.Pickup) && RolePermissions.Has(tenant.Role, Permission.ManagePickups))
        {
            tasks.Add(new("pickups", await db.PickupRequests.CountAsync(r => r.Status == PickupRequestStatus.Pending, cancellationToken)));
        }

        return new TodayDto(
            activeChildren,
            households,
            slipsDue,
            [.. events.Select(e => new TodayEventDto(e.Id, e.Name, e.StartsAt, e.Place, e.RequiresSlip))],
            [.. tasks.Where(t => t.Count > 0)]);
    }
}
