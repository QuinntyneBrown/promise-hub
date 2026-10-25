using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Programs;

public sealed class ListProgramsHandler(IPromiseHubDb db)
{
    public async Task<ProgramListDto> HandleAsync(string? status, CancellationToken cancellationToken = default)
    {
        var programs = await db.Programs.AsNoTracking().OrderBy(p => p.StartsOn).ThenBy(p => p.Name).ToListAsync(cancellationToken);
        var enrolled = (await db.Enrollments.AsNoTracking().Where(e => e.EndedAt == null).Select(e => e.ProgramId).ToListAsync(cancellationToken))
            .GroupBy(id => id).ToDictionary(g => g.Key, g => g.Count());
        var wanted = status == "archived" ? ProgramStatus.Archived : ProgramStatus.Active;
        var rows = programs
            .Where(p => p.Status == wanted)
            .Select(p => new ProgramSummaryDto(p.Id, p.Name, p.Schedule, p.StartsOn, p.EndsOn, enrolled.GetValueOrDefault(p.Id), p.Capacity, p.EnrollmentOpen, p.Status.ToString()))
            .ToList();
        var active = programs.Where(p => p.Status == ProgramStatus.Active).ToList();
        return new ProgramListDto(rows, active.Count, programs.Count - active.Count, active.Sum(p => enrolled.GetValueOrDefault(p.Id)));
    }
}
