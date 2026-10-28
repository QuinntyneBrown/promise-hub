using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Events;

public static class EventRules
{
    public static async Task<Dictionary<string, string>> CheckAsync(IPromiseHubDb db, ITenantContext tenant, SaveEventCommand c, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(c.Name))
        {
            errors["name"] = "Enter the event name.";
        }
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == c.ProgramId && p.Status == ProgramStatus.Active, cancellationToken);
        if (program is null)
        {
            errors["programId"] = "Choose an active program.";
        }
        if (c.StartsAt is null)
        {
            errors["startsAt"] = "Enter when it starts.";
        }
        if (c.EndsAt is null)
        {
            errors["endsAt"] = "Enter when it ends.";
        }
        else if (c.StartsAt is { } start && c.EndsAt <= start)
        {
            errors["endsAt"] = "End after it starts.";
        }
        if (c.RepeatsWeekly && program is not null && c.StartsAt is { } first)
        {
            var starts = WeeklySeries.Starts(first, program.EndsOn, await ZoneAsync(db, tenant.OrganizationId, cancellationToken));
            if (starts.Count == 0)
            {
                errors["startsAt"] = $"Start on or before the program’s last day, {program.EndsOn.ToString("ddd d MMM yyyy", CultureInfo.InvariantCulture)}.";
            }
            else if (starts.Count > WeeklySeries.MaximumSessions)
            {
                errors["repeatsWeekly"] = $"A weekly series can have at most {WeeklySeries.MaximumSessions} sessions.";
            }
        }
        return errors;
    }

    /// <summary>The organization's time zone, which decides its calendar days and a weekly series' local time.</summary>
    public static async Task<TimeZoneInfo> ZoneAsync(IPromiseHubDb db, Guid organizationId, CancellationToken cancellationToken) =>
        TimeZoneInfo.FindSystemTimeZoneById(await db.Organizations.AsNoTracking().Where(o => o.Id == organizationId).Select(o => o.TimeZone).SingleAsync(cancellationToken));

    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
