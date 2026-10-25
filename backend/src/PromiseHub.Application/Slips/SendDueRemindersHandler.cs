using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Organizations;
using PromiseHub.Domain.Slips;

namespace PromiseHub.Application.Slips;

/// <summary>Part of the per-tenant job: on each slip's schedule, reminds the households that have not answered, once per slot (L2-016 criterion 1).</summary>
public sealed class SendDueRemindersHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, SlipFamilies families, SlipReminderSender sender, TimeProvider clock)
{
    private static readonly System.Globalization.CultureInfo Culture = System.Globalization.CultureInfo.GetCultureInfo("en-CA");

    public async Task HandleAsync(CancellationToken cancellationToken = default)
    {
        if (!await modules.IsOnAsync(ModuleId.Slips, cancellationToken))
        {
            return;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(o => o.Id == tenant.OrganizationId, cancellationToken);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(organization.TimeZone);
        var now = clock.GetUtcNow();
        var slips = await db.PermissionSlips.Where(s => s.Status == SlipStatus.Sent && s.Reminders != SlipReminders.None).ToListAsync(cancellationToken);
        foreach (var slip in slips)
        {
            if (ReminderSlots.Due(slip, zone, now) is not { } due)
            {
                continue;
            }
            var slot = ReminderSlots.Key(due, zone);
            var reminded = await db.SlipReminders.Where(r => r.SlipId == slip.Id && r.Slot == slot).Select(r => r.HouseholdId).ToListAsync(cancellationToken);
            var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == slip.EventId, cancellationToken);
            if (e is null)
            {
                continue;
            }
            var due_ = (await families.UnsignedAsync(slip, e, cancellationToken)).Where(f => !reminded.Contains(f.HouseholdId)).ToList();
            if (due_.Count == 0)
            {
                continue;
            }
            var signBy = slip.SignBy.ToString("ddd d MMM", Culture).Replace(".", string.Empty);
            await sender.RemindAsync(slip, e, due_, ReminderKind.Scheduled, slot,
                (f, link) => $"Reminder: please sign {SlipReminderSender.Names(f)}’s permission slip for “{slip.Title}” by {signBy}. {(f.Children.Count == 1 ? $"{f.Children[0].FirstName}: " : string.Empty)}{link}",
                cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
