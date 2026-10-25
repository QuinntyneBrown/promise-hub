using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Messaging;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Messaging;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// Part of the per-tenant send job: for each session with no-show alerts on that started at least the delay ago and has not
/// ended, queues one text per household of the children still not checked in, recording each alert first so a retry never
/// texts twice. Texts go through the message path, so the SMS cap and email fallback apply (L2-018 criteria 1 and 3, L2-022, L2-034).
/// </summary>
public sealed class SendNoShowAlertsHandler(IPromiseHubDb db, ITenantContext tenant, IModuleGate modules, SessionReader reader, AudienceResolver resolver, MessageWriter writer, TimeProvider clock)
{
    public async Task HandleAsync(CancellationToken cancellationToken = default)
    {
        if (!await modules.IsOnAsync(ModuleId.RollCall, cancellationToken))
        {
            return;
        }
        var now = clock.GetUtcNow();
        var sessions = (await db.Events.Where(e => e.NoShowAlert && e.Status != EventStatus.Cancelled).ToListAsync(cancellationToken))
            .Where(e => e.StartsAt + NoShowRules.Delay <= now && e.EndsAt > now).ToList();
        foreach (var e in sessions)
        {
            var roster = await reader.RosterChildIdsAsync(e.ProgramId, cancellationToken);
            var accounted = await db.AttendanceRecords.Where(r => r.EventId == e.Id && r.ChildId != null && r.Status != AttendanceStatus.NotYet)
                .Select(r => r.ChildId!.Value).ToListAsync(cancellationToken);
            var alerted = await db.NoShowAlerts.Where(a => a.EventId == e.Id).Select(a => a.ChildId).ToListAsync(cancellationToken);
            var missing = roster.Except(accounted).Except(alerted).ToList();
            var children = await db.Children.AsNoTracking().Where(c => missing.Contains(c.Id)).ToListAsync(cancellationToken);
            foreach (var household in children.GroupBy(c => c.HouseholdId))
            {
                var names = string.Join(" and ", household.OrderBy(c => c.FirstName).Select(c => c.FirstName));
                var verb = household.Count() == 1 ? "isn’t" : "aren’t";
                var body = $"{names} {verb} checked in at {e.Name} yet. Reply 1 if on the way, 2 if absent.";
                foreach (var child in household)
                {
                    db.NoShowAlerts.Add(new NoShowAlert(Guid.NewGuid(), tenant.OrganizationId, e.Id, child.Id, household.Key, now));
                }
                var audience = await resolver.ForHouseholdAsync(household.Key, cancellationToken);
                writer.Queue(MessageSource.NoShow, $"Not checked in: {e.Name}", body, ChannelChoice.TextWithEmailFallback, audience,
                    new AudienceRequest(e.ProgramId, e.Id, null, body, ChannelChoice.TextWithEmailFallback));
            }
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
