using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Creates tracks and orders their modules (L2-066 criteria 2 and 5). Every write is audited.</summary>
public sealed class TrackCommands(IPromiseHubDb db, ITenantContext tenant, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Result> CreateAsync(CreateTrackCommand command, CancellationToken cancellationToken = default)
    {
        var name = CurriculumRules.Clean(command.Name);
        var description = CurriculumRules.Clean(command.Description);
        if (name is null)
        {
            return CurriculumRules.Invalid("name", "Give the track a name.");
        }
        if (name.Length > Track.MaximumName)
        {
            return CurriculumRules.Invalid("name", "Keep the name under 80 characters.");
        }
        if (description is { Length: > Track.MaximumDescription })
        {
            return CurriculumRules.Invalid("description", "Keep the description under 500 characters.");
        }
        var key = CurriculumRules.Clean(command.Key) ?? CurriculumRules.KeyFrom(name);
        if (!CurriculumRules.IsKey(key))
        {
            return CurriculumRules.Invalid("key", "Use lowercase letters, numbers and hyphens.");
        }
        if (await db.Tracks.AnyAsync(t => t.Key == key, cancellationToken))
        {
            return CurriculumRules.Invalid("key", "Another track already uses this key.");
        }
        var track = new Track(Guid.NewGuid(), tenant.OrganizationId, name, key, description,
            command.Publish ? ContentStatus.Published : ContentStatus.Draft, clock.GetUtcNow());
        db.Tracks.Add(track);
        audit.Record(new AuditEvent(AuditAction.Created, "Track", track.Id, name, After: new { name, key, description, Status = track.Status.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Created(track.Id);
    }

    public async Task<Result> ReorderModulesAsync(Guid trackId, IReadOnlyList<Guid>? moduleIds, CancellationToken cancellationToken = default)
    {
        var track = await db.Tracks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == trackId, cancellationToken);
        if (track is null)
        {
            return Result.NotFound;
        }
        var modules = await db.CurriculumModules.Where(m => m.TrackId == trackId).OrderBy(m => m.Position).ToListAsync(cancellationToken);
        if (!CurriculumRules.IsSameSet(moduleIds, modules.Select(m => m.Id).ToList()))
        {
            return CurriculumRules.Invalid("moduleIds", "Send every module of the track once.");
        }
        var before = modules.Select(m => m.Title).ToList();
        for (var i = 0; i < moduleIds!.Count; i++)
        {
            modules.Single(m => m.Id == moduleIds[i]).MoveTo(i + 1);
        }
        var after = moduleIds.Select(id => modules.Single(m => m.Id == id).Title).ToList();
        audit.Record(new AuditEvent(AuditAction.Updated, "Track", trackId, $"Module order · {track.Name}", new { Modules = before }, new { Modules = after }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }
}
