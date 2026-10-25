using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Guardian;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Attendance;

/// <summary>
/// A guardian's reply to a no-show text (L2-018 criterion 2): "1" records that the child is on the way; "2" marks every
/// alerted child of that household absent. The organization comes from the alert the number answers, never from the text.
/// The guardian home answers the same way through <see cref="ApplyAsync"/>.
/// </summary>
public sealed class NoShowReplyHandler(IPromiseHubDb db, TenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task HandleAsync(InboundSmsCommand command, CancellationToken cancellationToken = default)
    {
        var reply = command.Text?.Trim() switch { "1" => NoShowReply.OnTheWay, "2" => NoShowReply.Absent, _ => NoShowReply.None };
        var digits = ContactMask.Digits(command.From ?? string.Empty);
        if (reply == NoShowReply.None || digits.Length != 10)
        {
            return;
        }
        var now = clock.GetUtcNow();
        var open = (await db.NoShowAlerts.IgnoreQueryFilters().Where(a => a.Reply == NoShowReply.None).ToListAsync(cancellationToken))
            .Where(a => a.SentAt > now - NoShowRules.ReplyWindow).ToList();
        var households = open.Select(a => a.HouseholdId).Distinct().ToList();
        var matching = (await db.Guardians.IgnoreQueryFilters().AsNoTracking().Where(g => households.Contains(g.HouseholdId) && g.Mobile != null).ToListAsync(cancellationToken))
            .Where(g => ContactMask.Digits(g.Mobile!) == digits).Select(g => g.HouseholdId).ToHashSet();
        var latest = open.Where(a => matching.Contains(a.HouseholdId)).OrderByDescending(a => a.SentAt).FirstOrDefault();
        if (latest is null)
        {
            return;
        }
        tenant.ResolveForJob(latest.OrganizationId);
        await ApplyAsync(latest.EventId, latest.HouseholdId, reply, cancellationToken);
    }

    /// <summary>Applies a reply to the household's unanswered alerts for one session, in the organization already resolved; false when none is open.</summary>
    public async Task<bool> ApplyAsync(Guid eventId, Guid householdId, NoShowReply reply, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var alerts = await db.NoShowAlerts.Where(a => a.EventId == eventId && a.HouseholdId == householdId && a.Reply == NoShowReply.None).ToListAsync(cancellationToken);
        if (alerts.Count == 0)
        {
            return false;
        }
        var e = await db.Events.AsNoTracking().SingleAsync(x => x.Id == eventId, cancellationToken);
        foreach (var alert in alerts)
        {
            alert.Replied(reply, now);
            if (reply != NoShowReply.Absent)
            {
                continue;
            }
            var record = await db.AttendanceRecords.FirstOrDefaultAsync(r => r.EventId == alert.EventId && r.ChildId == alert.ChildId, cancellationToken);
            if (record is null)
            {
                record = new AttendanceRecord(Guid.NewGuid(), alert.OrganizationId, alert.EventId, alert.ChildId, null);
                db.AttendanceRecords.Add(record);
            }
            if (record.Status != AttendanceStatus.NotYet)
            {
                continue;
            }
            record.MarkAbsent(now, "Guardian reply");
            db.AttendanceEvents.Add(new AttendanceEvent(Guid.NewGuid(), alert.OrganizationId, record.Id, AttendanceEventKind.MarkedAbsent, now, null, Guid.NewGuid()));
            var child = await db.Children.AsNoTracking().SingleAsync(c => c.Id == alert.ChildId, cancellationToken);
            audit.Record(new AuditEvent(AuditAction.Updated, "Attendance", record.Id, $"{child.FullName} · {e.Name} · absent: guardian replied 2"));
        }
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
