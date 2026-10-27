using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Marks a reading or scripture lesson done for the youth (L2-069 criteria 4 and 5): once, audited once as Completed on
/// LessonProgress; coding lessons and projects complete through their checklist or submission instead (conflict).
/// </summary>
public sealed class LessonCompletion(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, IAuditWriter audit, TimeProvider clock, BadgeAwarder badges)
{
    public async Task<Gated<CompletionDto>> CompleteAsync(Guid lessonId, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found)
        {
            return Gated<CompletionDto>.NotFound();
        }
        var (_, module, status) = found;
        if (status.Locked)
        {
            return Gated<CompletionDto>.Locked(status.UnlockAfter);
        }
        if (status.Lesson.Kind is LessonKind.Coding or LessonKind.Project)
        {
            return new Gated<CompletionDto>(ResultStatus.Conflict);
        }
        await RecordAsync(status.Lesson, cancellationToken);
        return Gated<CompletionDto>.Found(After(module, status.Lesson.Id));
    }

    /// <summary>Adds the youth's progress row and its audit entry unless the lesson is done already.</summary>
    public async Task RecordAsync(Lesson lesson, CancellationToken cancellationToken)
    {
        if (await db.LessonProgress.AnyAsync(p => p.MembershipId == tenant.MembershipId && p.LessonId == lesson.Id, cancellationToken))
        {
            return;
        }
        var row = new LessonProgress(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, lesson.Id, clock.GetUtcNow());
        db.LessonProgress.Add(row);
        audit.Record(new AuditEvent(AuditAction.Completed, "LessonProgress", row.Id, $"{lesson.Title} completed by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        await badges.AwardAsync(tenant.MembershipId, cancellationToken);
    }

    /// <summary>The next lesson of the module after this one, counting it as done.</summary>
    public static CompletionDto After(ModuleStatus module, Guid lessonId)
    {
        var lessons = module.Lessons.ToList();
        var index = lessons.FindIndex(l => l.Lesson.Id == lessonId);
        var completed = lessons.Where((l, i) => i != index).All(l => l.Done);
        var next = lessons.Skip(index + 1).FirstOrDefault(l => !l.Done)?.Lesson;
        return new CompletionDto(next?.Id, next?.Title, next?.Kind.ToString(), completed);
    }
}
