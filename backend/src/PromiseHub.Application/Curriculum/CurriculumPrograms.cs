using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Curriculum;

/// <summary>The caller's organization's active programs, by name, with the track each follows (L2-066 criterion 7).</summary>
public sealed class CurriculumPrograms(IPromiseHubDb db)
{
    public Task<List<CurriculumProgramDto>> ActiveAsync(CancellationToken cancellationToken) =>
        db.Programs.AsNoTracking().Where(p => p.Status == ProgramStatus.Active).OrderBy(p => p.Name)
            .Select(p => new CurriculumProgramDto(p.Id, p.Name, p.Term, p.Schedule, p.TrackId)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<string>> FollowingAsync(Guid trackId, CancellationToken cancellationToken) =>
        (await ActiveAsync(cancellationToken)).Where(p => p.TrackId == trackId).Select(p => p.Name).ToList();
}
