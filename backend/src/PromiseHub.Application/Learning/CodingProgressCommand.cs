using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Saves a youth's code and ticks for a coding lesson or project (L2-070 criteria 3 and 4). Ticking every step of a coding lesson
/// completes it once, through LessonCompletion; saving without completing is not audited.
/// </summary>
public sealed class CodingProgressCommand(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, LessonCompletion completion, TimeProvider clock)
{
    public async Task<Gated<CodingSavedDto>> SaveAsync(Guid lessonId, SaveCodingRequest request, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found || found.Lesson.Lesson.Kind is not (LessonKind.Coding or LessonKind.Project))
        {
            return Gated<CodingSavedDto>.NotFound();
        }
        var (_, module, status) = found;
        if (status.Locked)
        {
            return Gated<CodingSavedDto>.Locked(status.UnlockAfter);
        }
        var code = request.Code ?? string.Empty;
        var ticks = (request.CheckedStepIds ?? []).Distinct().ToList();
        var stepIds = await db.CodingSteps.AsNoTracking().Where(s => s.LessonId == lessonId).OrderBy(s => s.Position).Select(s => s.Id).ToListAsync(cancellationToken);
        var errors = new Dictionary<string, string>();
        if (code.Length > Lesson.MaximumCode)
        {
            errors["code"] = "Keep your code under 50,000 characters.";
        }
        if (ticks.Any(id => !stepIds.Contains(id)))
        {
            errors["checkedStepIds"] = "Tick only items of this checklist.";
        }
        if (errors.Count > 0)
        {
            return Gated<CodingSavedDto>.Invalid(errors);
        }
        var workspace = await db.CodingWorkspaces.FirstOrDefaultAsync(w => w.MembershipId == tenant.MembershipId && w.LessonId == lessonId, cancellationToken);
        if (workspace is null)
        {
            workspace = new CodingWorkspace(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, lessonId);
            db.CodingWorkspaces.Add(workspace);
        }
        workspace.Save(code, stepIds.Where(ticks.Contains), clock.GetUtcNow());
        await db.SaveChangesAsync(cancellationToken);
        var completes = status.Lesson.Kind == LessonKind.Coding && stepIds.Count > 0 && ticks.Count == stepIds.Count;
        if (completes)
        {
            await completion.RecordAsync(status.Lesson, cancellationToken);
        }
        var done = completes || status.Done;
        var after = done ? LessonCompletion.After(module, lessonId) : null;
        return Gated<CodingSavedDto>.Found(new CodingSavedDto(ticks.Count, stepIds.Count, done, after?.NextLessonId, after?.NextLessonTitle, after?.NextLessonKind, after?.ModuleCompleted ?? false));
    }
}
