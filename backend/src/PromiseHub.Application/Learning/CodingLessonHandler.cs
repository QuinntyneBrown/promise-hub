using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>A visible, unlocked coding lesson or project with the youth's workspace (L2-070 criterion 1); other kinds are not found.</summary>
public sealed class CodingLessonHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress)
{
    public async Task<Gated<CodingViewDto>> HandleAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found || found.Lesson.Lesson.Kind is not (LessonKind.Coding or LessonKind.Project))
        {
            return Gated<CodingViewDto>.NotFound();
        }
        var (_, module, status) = found;
        if (status.Locked)
        {
            return Gated<CodingViewDto>.Locked(status.UnlockAfter);
        }
        var lesson = status.Lesson;
        var steps = await db.CodingSteps.AsNoTracking().Where(s => s.LessonId == lesson.Id).OrderBy(s => s.Position)
            .Select(s => new CodingStepDto(s.Id, s.Title, s.Instructions, s.Sample, s.CheckLabel)).ToListAsync(cancellationToken);
        var workspace = await db.CodingWorkspaces.AsNoTracking()
            .FirstOrDefaultAsync(w => w.MembershipId == tenant.MembershipId && w.LessonId == lesson.Id, cancellationToken);
        var index = module.Lessons.ToList().IndexOf(status);
        var next = index + 1 < module.Lessons.Count ? module.Lessons[index + 1].Lesson : null;
        return Gated<CodingViewDto>.Found(new CodingViewDto(lesson.Id, lesson.Kind.ToString(), lesson.Title, lesson.Body, lesson.Minutes,
            module.Module.Id, module.Module.Title, index + 1, module.Lessons.Count, steps,
            workspace?.Code ?? lesson.StarterCode ?? string.Empty,
            workspace?.Checked.Where(id => steps.Any(s => s.Id == id)).ToList() ?? [],
            status.Done, next is null ? null : new LessonRefDto(next.Id, next.Title, next.Kind.ToString())));
    }
}
