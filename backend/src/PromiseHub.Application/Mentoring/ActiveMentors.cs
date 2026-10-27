using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>The caller's organization's active mentors: Mentor memberships that have not been removed (ADR 0048).</summary>
public sealed class ActiveMentors(IPromiseHubDb db)
{
    public async Task<IReadOnlyList<MentorOptionDto>> ListAsync(CancellationToken cancellationToken = default) =>
        await db.Memberships.AsNoTracking()
            .Where(m => m.Role == Role.Mentor && m.RemovedAt == null)
            .OrderBy(m => m.PersonName)
            .Select(m => new MentorOptionDto(m.Id, m.PersonName))
            .ToListAsync(cancellationToken);

    public async Task<bool> AreActiveAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default) =>
        await db.Memberships.CountAsync(m => ids.Contains(m.Id) && m.Role == Role.Mentor && m.RemovedAt == null, cancellationToken) == ids.Distinct().Count();
}
