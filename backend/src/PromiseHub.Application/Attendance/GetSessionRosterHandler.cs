using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Identity;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;

namespace PromiseHub.Application.Attendance;

/// <summary>A session's roster: enrolled children and walk-ins with their status, sorted by name.</summary>
public sealed class GetSessionRosterHandler(IPromiseHubDb db, ITenantContext tenant, TimeProvider clock, SessionReader reader, SessionAccess access)
{
    public async Task<(ResultStatus Status, SessionRosterDto? Roster)> HandleAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return (ResultStatus.NotFound, null);
        }
        if (!await access.AllowsAsync(eventId, cancellationToken))
        {
            return (ResultStatus.Forbidden, null);
        }
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var medical = RolePermissions.Has(tenant.Role, Permission.ReadMedical);
        var childIds = await reader.RosterChildIdsAsync(e.ProgramId, cancellationToken);
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToListAsync(cancellationToken);
        var records = await db.AttendanceRecords.AsNoTracking().Where(r => r.EventId == eventId).ToListAsync(cancellationToken);
        var walkIns = await db.WalkIns.AsNoTracking().Where(w => w.EventId == eventId).ToListAsync(cancellationToken);
        var alerts = await db.NoShowAlerts.AsNoTracking().Where(a => a.EventId == eventId).ToListAsync(cancellationToken);

        var rows = children.Select(c =>
        {
            var record = records.FirstOrDefault(r => r.ChildId == c.Id);
            var flag = !medical ? null
                : !string.IsNullOrWhiteSpace(c.Allergies) ? "Allergy"
                : !string.IsNullOrWhiteSpace(c.Medication) ? "Medication"
                : string.IsNullOrWhiteSpace(c.Conditions) ? null : c.Conditions;
            return new RosterEntryDto(c.Id, c.Id, c.HouseholdId, c.FullName, c.AgeOn(today), c.School, flag,
                (record?.Status ?? AttendanceStatus.NotYet).ToString(), record?.CheckedInAt, WalkIn: false, record?.SignedOutAt, record?.CollectedBy,
                alerts.FirstOrDefault(a => a.ChildId == c.Id) is { } alert ? (alert.Reply == NoShowReply.None ? "TextSent" : alert.Reply.ToString()) : null,
                alerts.FirstOrDefault(a => a.ChildId == c.Id)?.SentAt);
        }).Concat(walkIns.Select(w =>
        {
            var record = records.FirstOrDefault(r => r.WalkInId == w.Id);
            var flag = medical && !string.IsNullOrWhiteSpace(w.MedicalNotes) ? "Medical note" : null;
            return new RosterEntryDto(w.Id, null, null, w.ChildName, null, null, flag,
                (record?.Status ?? AttendanceStatus.NotYet).ToString(), record?.CheckedInAt, WalkIn: true, record?.SignedOutAt, record?.CollectedBy);
        }));
        return (ResultStatus.Done, new SessionRosterDto(await reader.SummaryAsync(e, cancellationToken), [.. rows.OrderBy(r => r.Name, StringComparer.CurrentCulture)]));
    }
}
