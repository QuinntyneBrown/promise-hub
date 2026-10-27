using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Mentoring;

/// <summary>Reads the mentor-facing rows of a set of youth: name, age today and active non-archived programs, ordered by name.</summary>
public sealed class MentoredYouthReader(IPromiseHubDb db, TimeProvider clock)
{
    public async Task<IReadOnlyList<MentoredYouthDto>> ReadAsync(IReadOnlyCollection<Guid> childIds, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var children = await db.Children.AsNoTracking().Where(c => childIds.Contains(c.Id)).ToListAsync(cancellationToken);
        var programs = await (
            from e in db.Enrollments.AsNoTracking()
            where childIds.Contains(e.ChildId) && e.EndedAt == null
            join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
            where p.Status != ProgramStatus.Archived
            select new { e.ChildId, p.Name }).ToListAsync(cancellationToken);
        return [.. children.OrderBy(c => c.FirstName).ThenBy(c => c.LastName)
            .Select(c => new MentoredYouthDto(c.Id, c.FullName, c.AgeOn(today),
                [.. programs.Where(p => p.ChildId == c.Id).Select(p => p.Name).Order()]))];
    }
}
