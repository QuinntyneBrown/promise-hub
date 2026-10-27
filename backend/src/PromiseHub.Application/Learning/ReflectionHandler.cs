using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// A youth's reflection on a lesson she can open (L2-089 criteria 1 to 4 and 7, ADR 0060): 404 for a lesson she can't see, 403 with what to
/// finish first for a locked one. Saving needs a mood and her words, keeps one row per membership and lesson, and is audited as Created or
/// Updated with whether it is shared, never her words or her mood.
/// </summary>
public sealed class ReflectionHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, YouthMentorName mentors, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Gated<ReflectionEditorDto>> GetAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found)
        {
            return Gated<ReflectionEditorDto>.NotFound();
        }
        var (track, module, status) = found;
        if (status.Locked)
        {
            return Gated<ReflectionEditorDto>.Locked(status.UnlockAfter);
        }
        var saved = await MineAsync(lessonId, cancellationToken);
        return Gated<ReflectionEditorDto>.Found(new ReflectionEditorDto(lessonId, status.Lesson.Title, module.Module.Id, module.Module.Title,
            CurriculumRules.SplitLines(status.Lesson.Prompts), await mentors.FindAsync(track.Track.Id, cancellationToken), saved is null ? null : ToDto(saved)));
    }

    public async Task<Gated<ReflectionDto>> SaveAsync(Guid lessonId, SaveReflectionRequest request, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found)
        {
            return Gated<ReflectionDto>.NotFound();
        }
        var status = found.Lesson;
        if (status.Locked)
        {
            return Gated<ReflectionDto>.Locked(status.UnlockAfter);
        }
        var text = request.Text?.Trim() ?? string.Empty;
        var action = string.IsNullOrWhiteSpace(request.Action) ? null : request.Action.Trim();
        var errors = new Dictionary<string, string>();
        if (!Enum.TryParse<ReflectionMood>(request.Mood, out var mood) || !Enum.IsDefined(mood) || int.TryParse(request.Mood, out _))
        {
            errors["mood"] = "Choose how you’re feeling.";
        }
        if (text.Length == 0)
        {
            errors["text"] = "Write your reflection.";
        }
        else if (text.Length > Reflection.MaximumText)
        {
            errors["text"] = "Keep your reflection under 5,000 characters.";
        }
        if (action?.Length > Reflection.MaximumAction)
        {
            errors["action"] = "Keep it under 1,000 characters.";
        }
        if (errors.Count > 0)
        {
            return Gated<ReflectionDto>.Invalid(errors);
        }
        var now = clock.GetUtcNow();
        var reflection = await db.Reflections.FirstOrDefaultAsync(r => r.MembershipId == tenant.MembershipId && r.LessonId == lessonId, cancellationToken);
        var created = reflection is null;
        var sharedBefore = reflection?.Shared;
        if (reflection is null)
        {
            reflection = new Reflection(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, lessonId, now);
            db.Reflections.Add(reflection);
        }
        reflection.Save(mood, text, action, request.Shared, now);
        var visibility = request.Shared ? "shared with her mentor" : "private";
        audit.Record(new AuditEvent(created ? AuditAction.Created : AuditAction.Updated, "Reflection", reflection.Id,
            $"Reflection on {status.Lesson.Title} saved, {visibility}",
            Before: created ? null : new { Shared = sharedBefore }, After: new { request.Shared }));
        await db.SaveChangesAsync(cancellationToken);
        return Gated<ReflectionDto>.Found(ToDto(reflection));
    }

    private Task<Reflection?> MineAsync(Guid lessonId, CancellationToken cancellationToken) =>
        db.Reflections.AsNoTracking().FirstOrDefaultAsync(r => r.MembershipId == tenant.MembershipId && r.LessonId == lessonId, cancellationToken);

    private static ReflectionDto ToDto(Reflection r) => new(r.Mood.ToString(), r.Text, r.Action, r.Shared, r.SavedAt);
}
