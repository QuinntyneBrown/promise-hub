using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Programs;

namespace PromiseHub.Application.Learning;

/// <summary>
/// What the signed-in youth may see and open (L2-068, ADR 0051). Visible: Published content of a Published track followed by an
/// active, non-archived program the youth's child is enrolled in, in the caller's organization. A module is locked while its
/// prerequisite is Published and not done; a lesson while its module is locked or an earlier published lesson is not done.
/// Every youth read and write asks here, so the locks hold on the server.
/// </summary>
public sealed class LearnerProgress(IPromiseHubDb db, ITenantContext tenant)
{
    public async Task<IReadOnlyList<TrackStatus>> TracksAsync(CancellationToken cancellationToken = default)
    {
        var followed = await FollowedAsync(cancellationToken);
        var result = new List<TrackStatus>();
        foreach (var (track, program) in followed)
        {
            result.Add(await BuildAsync(track, program, cancellationToken));
        }
        return result;
    }

    public async Task<TrackStatus?> TrackAsync(Guid trackId, CancellationToken cancellationToken = default)
    {
        var match = (await FollowedAsync(cancellationToken)).FirstOrDefault(f => f.Track.Id == trackId);
        return match.Track is null ? null : await BuildAsync(match.Track, match.Program, cancellationToken);
    }

    /// <summary>The visible module with its track, or null when it is not visible.</summary>
    public async Task<(TrackStatus Track, ModuleStatus Module)?> ModuleAsync(Guid moduleId, CancellationToken cancellationToken = default)
    {
        var trackId = await db.CurriculumModules.AsNoTracking().Where(m => m.Id == moduleId).Select(m => (Guid?)m.TrackId).FirstOrDefaultAsync(cancellationToken);
        var track = trackId is { } id ? await TrackAsync(id, cancellationToken) : null;
        var module = track?.Modules.FirstOrDefault(m => m.Module.Id == moduleId);
        return module is null ? null : (track!, module);
    }

    /// <summary>The visible lesson with its module and track, or null when it is not visible.</summary>
    public async Task<(TrackStatus Track, ModuleStatus Module, LessonStatus Lesson)?> LessonAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        var moduleId = await db.Lessons.AsNoTracking().Where(l => l.Id == lessonId).Select(l => (Guid?)l.ModuleId).FirstOrDefaultAsync(cancellationToken);
        var found = moduleId is { } id ? await ModuleAsync(id, cancellationToken) : null;
        var lesson = found?.Module.Lessons.FirstOrDefault(l => l.Lesson.Id == lessonId);
        return lesson is null ? null : (found!.Value.Track, found.Value.Module, lesson);
    }

    private async Task<List<(Track Track, string Program)>> FollowedAsync(CancellationToken cancellationToken)
    {
        var childId = await db.Memberships.AsNoTracking()
            .Where(m => m.Id == tenant.MembershipId && m.OrganizationId == tenant.OrganizationId)
            .Select(m => m.ChildId).FirstOrDefaultAsync(cancellationToken);
        if (childId is not { } child)
        {
            return [];
        }
        var rows = await (from e in db.Enrollments.AsNoTracking()
                          join p in db.Programs.AsNoTracking() on e.ProgramId equals p.Id
                          join t in db.Tracks.AsNoTracking() on p.TrackId equals t.Id
                          where e.ChildId == child && e.EndedAt == null && p.Status != ProgramStatus.Archived && t.Status == ContentStatus.Published
                                && e.OrganizationId == tenant.OrganizationId && p.OrganizationId == tenant.OrganizationId && t.OrganizationId == tenant.OrganizationId
                          select new { Track = t, p.Name, p.StartsOn }).ToListAsync(cancellationToken);
        return rows.OrderBy(r => r.StartsOn).ThenBy(r => r.Name).GroupBy(r => r.Track.Id).Select(g => (g.First().Track, g.First().Name)).ToList();
    }

    private async Task<TrackStatus> BuildAsync(Track track, string program, CancellationToken cancellationToken)
    {
        var modules = await db.CurriculumModules.AsNoTracking().Where(m => m.TrackId == track.Id).ToListAsync(cancellationToken);
        var moduleIds = modules.Select(m => m.Id).ToList();
        var lessons = await db.Lessons.AsNoTracking()
            .Where(l => moduleIds.Contains(l.ModuleId) && l.Status == ContentStatus.Published && l.DeletedAt == null)
            .ToListAsync(cancellationToken);
        var lessonIds = lessons.Select(l => l.Id).ToList();
        var done = (await db.LessonProgress.AsNoTracking()
            .Where(p => p.MembershipId == tenant.MembershipId && lessonIds.Contains(p.LessonId))
            .Select(p => p.LessonId).ToListAsync(cancellationToken)).ToHashSet();

        bool ModuleDone(Guid id) => lessons.Where(l => l.ModuleId == id).All(l => done.Contains(l.Id));

        var result = new List<ModuleStatus>();
        var position = 0;
        foreach (var module in modules.Where(m => m.Status == ContentStatus.Published).OrderBy(m => m.Position))
        {
            position++;
            var prerequisite = module.PrerequisiteModuleId is { } pid ? modules.FirstOrDefault(m => m.Id == pid) : null;
            var locked = prerequisite is { Status: ContentStatus.Published } && !ModuleDone(prerequisite.Id);
            var unlock = locked ? prerequisite!.Title : null;
            var items = new List<LessonStatus>();
            string? firstNotDone = null;
            foreach (var lesson in lessons.Where(l => l.ModuleId == module.Id).OrderBy(l => l.Position))
            {
                var isDone = done.Contains(lesson.Id);
                var lessonLocked = !isDone && (locked || firstNotDone is not null);
                items.Add(new LessonStatus(lesson, isDone, lessonLocked, lessonLocked ? (locked ? unlock : firstNotDone) : null));
                if (!isDone && firstNotDone is null)
                {
                    firstNotDone = lesson.Title;
                }
            }
            result.Add(new ModuleStatus(module, position, items, locked, unlock));
        }
        return new TrackStatus(track, program, result);
    }
}
