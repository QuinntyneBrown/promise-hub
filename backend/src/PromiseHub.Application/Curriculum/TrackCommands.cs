using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Curriculum;

/// <summary>Creates tracks, sets their status and orders their modules (L2-066 criteria 2, 5 and 6). Every write is audited.</summary>
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

    public async Task<Result> SetStatusAsync(Guid id, string? status, CancellationToken cancellationToken = default)
    {
        var track = await db.Tracks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (track is null)
        {
            return Result.NotFound;
        }
        if (CurriculumRules.ParseStatus(status, allowReview: false) is not { } next)
        {
            return CurriculumRules.Invalid("status", "Choose Draft or Published.");
        }
        var before = track.Status.ToString();
        track.SetStatus(next);
        audit.Record(new AuditEvent(AuditAction.Updated, "Track", id, $"{track.Name} · {next}", new { Status = before }, new { Status = next.ToString() }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
    }

    /// <summary>The whole list of active programs that follow the track: chosen ones move here, the rest follow none (ADR 0050).</summary>
    public async Task<Result> SetCohortsAsync(Guid id, IReadOnlyList<Guid>? programIds, CancellationToken cancellationToken = default)
    {
        var track = await db.Tracks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (track is null)
        {
            return Result.NotFound;
        }
        var chosen = programIds ?? [];
        var programs = await db.Programs.Where(p => p.Status == Domain.Programs.ProgramStatus.Active && (chosen.Contains(p.Id) || p.TrackId == id)).ToListAsync(cancellationToken);
        if (chosen.Distinct().Count() != chosen.Count || !chosen.All(c => programs.Any(p => p.Id == c)))
        {
            return CurriculumRules.Invalid("programIds", "Choose active programs of your organization.");
        }
        var before = programs.Where(p => p.TrackId == id).Select(p => p.Name).OrderBy(n => n).ToList();
        foreach (var program in programs)
        {
            program.FollowTrack(chosen.Contains(program.Id) ? id : null);
        }
        var after = programs.Where(p => chosen.Contains(p.Id)).Select(p => p.Name).OrderBy(n => n).ToList();
        audit.Record(new AuditEvent(AuditAction.Updated, "Track", id, $"Cohorts · {track.Name}", new { Cohorts = before }, new { Cohorts = after }));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Done;
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
