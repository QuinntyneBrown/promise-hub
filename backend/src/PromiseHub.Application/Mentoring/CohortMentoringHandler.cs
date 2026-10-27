using Microsoft.EntityFrameworkCore;

namespace PromiseHub.Application.Mentoring;

/// <summary>Reads a cohort's mentoring (L2-062 criterion 1): assignments to a membership that is no longer an active mentor are ignored.</summary>
public sealed class CohortMentoringHandler(IPromiseHubDb db, ActiveMentors activeMentors)
{
    public async Task<CohortMentoringDto?> HandleAsync(Guid programId, CancellationToken cancellationToken = default)
    {
        if (!await db.Programs.AnyAsync(p => p.Id == programId, cancellationToken))
        {
            return null;
        }
        var mentors = await activeMentors.ListAsync(cancellationToken);
        var byId = mentors.ToDictionary(m => m.Id);
        var roster = await (
            from e in db.Enrollments.AsNoTracking()
            where e.ProgramId == programId && e.EndedAt == null
            join c in db.Children.AsNoTracking() on e.ChildId equals c.Id
            select new { c.Id, c.FirstName, c.LastName }).ToListAsync(cancellationToken);
        var childIds = roster.Select(r => r.Id).ToList();
        var assigned = await db.YouthMentors.AsNoTracking().Where(y => childIds.Contains(y.ChildId))
            .ToDictionaryAsync(y => y.ChildId, y => y.MentorMembershipId, cancellationToken);
        var team = await db.CohortMentors.AsNoTracking().Where(t => t.ProgramId == programId).ToListAsync(cancellationToken);
        var youth = roster.OrderBy(r => r.LastName).ThenBy(r => r.FirstName)
            .Select(r => new YouthMentorDto(r.Id, $"{r.FirstName} {r.LastName}",
                assigned.TryGetValue(r.Id, out var mentor) ? byId.GetValueOrDefault(mentor) : null))
            .ToList();
        var lead = team.Where(t => t.IsLead).Select(t => byId.GetValueOrDefault(t.MentorMembershipId)).FirstOrDefault(m => m is not null);
        var supporting = team.Where(t => !t.IsLead).Select(t => byId.GetValueOrDefault(t.MentorMembershipId)).OfType<MentorOptionDto>()
            .OrderBy(m => m.Name).ToList();
        return new CohortMentoringDto(programId, lead, supporting, youth, mentors);
    }
}
