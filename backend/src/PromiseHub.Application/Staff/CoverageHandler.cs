using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Events;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Staff;

/// <summary>
/// Staff coverage (page: coverage; L2-009 criterion 8): the next 14 days of sessions with who works each and the gaps, and
/// assigning staff, which decides the sessions a youth worker can run (ADR 0012). Assignments are audited.
/// </summary>
public sealed class CoverageHandler(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public static readonly TimeSpan Window = TimeSpan.FromDays(14);

    public async Task<CoverageDto> ListAsync(CancellationToken cancellationToken = default)
    {
        // Youth accounts are never staffed onto a session (ADR 0043).
        var people = await db.Memberships.AsNoTracking().Where(m => m.RemovedAt == null && m.Role != Role.Youth).OrderBy(m => m.PersonName).ToListAsync(cancellationToken);
        var sessions = await SessionsAsync(null, cancellationToken);
        return new CoverageDto(sessions, [.. people.Select(m => new CoveragePersonDto(m.Id, m.PersonName, m.Role.ToString()))]);
    }

    public async Task<CoverageDto> MineAsync(CancellationToken cancellationToken = default) =>
        new(await SessionsAsync(tenant.MembershipId, cancellationToken), []);

    public async Task<Result> AssignAsync(Guid eventId, AssignStaffCommand command, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null)
        {
            return Result.NotFound;
        }
        var ids = (command.MembershipIds ?? []).Distinct().ToList();
        var people = await db.Memberships.AsNoTracking().Where(m => ids.Contains(m.Id) && m.RemovedAt == null && m.Role != Role.Youth).ToListAsync(cancellationToken);
        if (people.Count != ids.Count)
        {
            return Result.Invalid(new Dictionary<string, string> { ["membershipIds"] = "Choose people who work for this organization." });
        }
        db.SessionStaff.RemoveRange(await db.SessionStaff.Where(s => s.EventId == eventId).ToListAsync(cancellationToken));
        foreach (var person in people)
        {
            db.SessionStaff.Add(new SessionStaff(Guid.NewGuid(), tenant.OrganizationId, eventId, person.Id));
        }
        var names = people.Count == 0 ? "no one" : string.Join(", ", people.Select(p => p.PersonName).Order());
        audit.Record(new AuditEvent(AuditAction.Updated, "Session", eventId, $"{e.Name} · staff: {names} · by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    private async Task<IReadOnlyList<CoverageSessionDto>> SessionsAsync(Guid? onlyFor, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var events = (await db.Events.AsNoTracking().Where(e => e.Status == EventStatus.Scheduled).ToListAsync(cancellationToken))
            .Where(e => e.EndsAt > now && e.StartsAt < now + Window).OrderBy(e => e.StartsAt).ToList();
        var ids = events.Select(e => e.Id).ToList();
        var staff = await db.SessionStaff.AsNoTracking().Where(s => ids.Contains(s.EventId)).ToListAsync(cancellationToken);
        var memberIds = staff.Select(s => s.MembershipId).Distinct().ToList();
        var people = await db.Memberships.AsNoTracking().Where(m => memberIds.Contains(m.Id) && m.RemovedAt == null).ToDictionaryAsync(m => m.Id, cancellationToken);
        return [.. events
            .Where(e => onlyFor is null || staff.Any(s => s.EventId == e.Id && s.MembershipId == onlyFor))
            .Select(e =>
            {
                var crew = staff.Where(s => s.EventId == e.Id && people.ContainsKey(s.MembershipId)).Select(s => people[s.MembershipId])
                    .OrderBy(m => m.PersonName).Select(m => new CoveragePersonDto(m.Id, m.PersonName, m.Role.ToString())).ToList();
                return new CoverageSessionDto(e.Id, e.Name, e.StartsAt, e.EndsAt, e.Place, crew, crew.Count == 0);
            })];
    }
}
