using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Domain.Audit;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The cohort page for a mentor (L2-065): 404 outside the organization, 403 (audited) for a cohort the caller neither leads nor supports
/// or one that is archived, otherwise the cohort with its active mentors and active roster.
/// </summary>
public sealed class MentorCohortHandler(IPromiseHubDb db, MentorScope scope, ActiveMentors activeMentors, IAuditWriter audit, TimeProvider clock)
{
    public async Task<(ResultStatus Status, MentorCohortDto? Cohort)> HandleAsync(Guid programId, CancellationToken cancellationToken = default)
    {
        var program = await db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == programId, cancellationToken);
        if (program is null)
        {
            return (ResultStatus.NotFound, null);
        }
        var mine = (await scope.CohortsAsync(cancellationToken)).FirstOrDefault(c => c.ProgramId == programId);
        if (mine is null)
        {
            audit.Record(new AuditEvent(AuditAction.AccessDenied, "Program", programId, $"{program.Name} · not on the mentor’s team"));
            await db.SaveChangesAsync(cancellationToken);
            return (ResultStatus.Forbidden, null);
        }
        var mentors = (await activeMentors.ListAsync(cancellationToken)).ToDictionary(m => m.Id, m => m.Name);
        var team = await db.CohortMentors.AsNoTracking().Where(t => t.ProgramId == programId).ToListAsync(cancellationToken);
        var lead = team.Where(t => t.IsLead).Select(t => mentors.GetValueOrDefault(t.MentorMembershipId)).FirstOrDefault(n => n is not null);
        var supporting = team.Where(t => !t.IsLead).Select(t => mentors.GetValueOrDefault(t.MentorMembershipId)).OfType<string>().Order().ToList();
        var roster = await (
            from e in db.Enrollments.AsNoTracking()
            where e.ProgramId == programId && e.EndedAt == null
            join c in db.Children.AsNoTracking() on e.ChildId equals c.Id
            select c).ToListAsync(cancellationToken);
        var ids = roster.Select(c => c.Id).ToList();
        var assigned = await db.YouthMentors.AsNoTracking().Where(y => ids.Contains(y.ChildId))
            .ToDictionaryAsync(y => y.ChildId, y => y.MentorMembershipId, cancellationToken);
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var members = roster.OrderBy(c => c.FirstName).ThenBy(c => c.LastName)
            .Select(c => new MentorCohortMemberDto(c.Id, c.FullName, c.AgeOn(today),
                assigned.TryGetValue(c.Id, out var m) ? mentors.GetValueOrDefault(m) : null))
            .ToList();
        return (ResultStatus.Done, new MentorCohortDto(program.Id, program.Name, program.Term, program.Schedule,
            mine.IsLead ? "Lead" : "Supporting", lead, supporting, members));
    }
}
