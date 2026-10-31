using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Mentoring;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.LearningBond;

/// <summary>
/// Counts the households Learning Bond reaches (L2-138, ADR 0076): a household is covered when a child under 18 is actively enrolled in a
/// covered running program. Counts only; no household record leaves this class (L2-136 criterion 5). Launch, the families list and the
/// dashboard reuse it.
/// </summary>
public sealed class LearningBondCoverage(IPromiseHubDb db, OrganizationToday today)
{
    /// <summary>The tenant's running programs, in name order, each with the households it reaches, and the households all of them reach.</summary>
    public async Task<(IReadOnlyList<LearningBondProgramDto> Programs, int AllHouseholds)> CountAsync(CancellationToken cancellationToken = default)
    {
        var programs = await db.Programs.AsNoTracking().Where(p => p.Status == ProgramStatus.Active).OrderBy(p => p.Name).Select(p => new { p.Id, p.Name })
            .ToListAsync(cancellationToken);
        var reached = await ReachedAsync(cancellationToken);
        return ([.. programs.Select(p => new LearningBondProgramDto(p.Id, p.Name, reached.Where(r => r.ProgramId == p.Id).Select(r => r.HouseholdId).Distinct().Count()))],
            reached.Select(r => r.HouseholdId).Distinct().Count());
    }

    /// <summary>The households the given programs reach together; every running program when <paramref name="programIds"/> is null.</summary>
    public async Task<int> CountAsync(IReadOnlyCollection<Guid>? programIds, CancellationToken cancellationToken = default)
    {
        var reached = await ReachedAsync(cancellationToken);
        return reached.Where(r => programIds is null || programIds.Contains(r.ProgramId)).Select(r => r.HouseholdId).Distinct().Count();
    }

    private async Task<List<(Guid ProgramId, Guid HouseholdId)>> ReachedAsync(CancellationToken cancellationToken)
    {
        var on = await today.GetAsync(cancellationToken);
        var rows = await (
            from e in db.Enrollments.AsNoTracking()
            join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
            join c in db.Children.AsNoTracking() on e.ChildId equals c.Id
            where e.EndedAt == null && p.Status == ProgramStatus.Active
            select new { e.ProgramId, c.HouseholdId, Child = c }).ToListAsync(cancellationToken);
        return [.. rows.Where(r => r.Child.AgeOn(on) is null or < 18).Select(r => (r.ProgramId, r.HouseholdId))];
    }
}
