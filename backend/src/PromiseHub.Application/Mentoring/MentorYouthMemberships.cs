using Microsoft.EntityFrameworkCore;
using PromiseHub.Domain.Organizations;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// The youth accounts of the signed-in mentor's youth (ADR 0057): the current Youth memberships linked to a child that <see cref="MentorScope"/>
/// answers, by membership id with the youth's name. Every review read and grade asks here first.
/// </summary>
public sealed class MentorYouthMemberships(IPromiseHubDb db, MentorScope scope)
{
    public async Task<IReadOnlyDictionary<Guid, string>> ReadAsync(CancellationToken cancellationToken = default)
    {
        var children = await scope.YouthIdsAsync(cancellationToken);
        return await db.Memberships.AsNoTracking()
            .Where(m => m.Role == Role.Youth && m.RemovedAt == null && m.ChildId != null && children.Contains(m.ChildId.Value))
            .ToDictionaryAsync(m => m.Id, m => m.PersonName, cancellationToken);
    }
}
