using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Attendance;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// A youth's record for their mentor (L2-064): 404 for a child outside the organization, 403 (audited) for one outside the mentor scope,
/// otherwise the mentor-safe record, audited as Viewed.
/// </summary>
public sealed class MentorYouthRecordHandler(
    IPromiseHubDb db, MentorScope scope, MentoredYouthReader reader, IModuleGate modules, IAuditWriter audit, TimeProvider clock)
{
    private const int AttendanceRows = 10;

    public async Task<(ResultStatus Status, MentorYouthRecordDto? Record)> HandleAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var child = await db.Children.AsNoTracking().FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child is null)
        {
            return (ResultStatus.NotFound, null);
        }
        if (!await scope.CanSeeYouthAsync(childId, cancellationToken))
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Child", childId, "Mentor record outside the mentor’s youth"));
            await db.SaveChangesAsync(cancellationToken);
            return (ResultStatus.Forbidden, null);
        }
        var row = (await reader.ReadAsync([childId], cancellationToken))[0];
        var mentor = await (
            from y in db.YouthMentors.AsNoTracking()
            where y.ChildId == childId
            join m in db.Memberships.AsNoTracking() on y.MentorMembershipId equals m.Id
            where m.Role == Role.Mentor && m.RemovedAt == null
            select m.PersonName).FirstOrDefaultAsync(cancellationToken);
        var setup = await (
            from m in db.Memberships.AsNoTracking()
            where m.ChildId == childId && m.Role == Role.Youth && m.RemovedAt == null
            join o in db.YouthOnboardings.AsNoTracking() on m.Id equals o.MembershipId
            where o.CompletedAt != null
            select new { o.PreferredName, o.Pronouns }).FirstOrDefaultAsync(cancellationToken);
        var guardians = (await db.Guardians.AsNoTracking().Where(g => g.HouseholdId == child.HouseholdId).ToListAsync(cancellationToken))
            .OrderByDescending(g => g.IsPrimary).ThenBy(g => g.Name)
            .Select(g => new MentorGuardianContactDto(g.Name, g.Relationship, g.Mobile, g.Email, g.IsPrimary))
            .ToList();
        var attendance = await modules.IsOnAsync(ModuleId.RollCall, cancellationToken) ? await AttendanceAsync(childId, cancellationToken) : null;
        audit.Record(new AuditEvent(AuditAction.Viewed, "Child", childId, $"{child.FullName} · mentor record"));
        await db.SaveChangesAsync(cancellationToken);
        return (ResultStatus.Done, new MentorYouthRecordDto(child.Id, child.FullName, setup?.PreferredName, setup?.Pronouns, row.Age, child.School,
            row.Programs, mentor, guardians, attendance));
    }

    private async Task<IReadOnlyList<MentorAttendanceDto>> AttendanceAsync(Guid childId, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var rows = await (
            from r in db.AttendanceRecords.AsNoTracking()
            where r.ChildId == childId && r.Status != AttendanceStatus.NotYet
            join e in db.Events.AsNoTracking() on r.EventId equals e.Id
            select new { r.Status, r.CheckedInAt, r.SignedOutAt, e.Name, e.StartsAt }).ToListAsync(cancellationToken);
        return [.. rows.Where(r => r.StartsAt <= now)
            .Select(r => r.Status switch
            {
                AttendanceStatus.SignedOut => new MentorAttendanceDto(r.Name, r.SignedOutAt ?? r.StartsAt, "SignedOut"),
                AttendanceStatus.Absent => new MentorAttendanceDto(r.Name, r.StartsAt, "Absent"),
                _ => new MentorAttendanceDto(r.Name, r.CheckedInAt ?? r.StartsAt, "CheckedIn"),
            })
            .OrderByDescending(a => a.At).Take(AttendanceRows)];
    }
}
