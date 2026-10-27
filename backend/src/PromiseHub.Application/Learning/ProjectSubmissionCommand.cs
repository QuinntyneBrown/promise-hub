using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Submits a youth's coding project to their mentor (L2-070 criterion 4, ADR 0051): once, as Submitted, audited as Created on
/// ProjectSubmission; submitting completes the project for gating.
/// </summary>
public sealed class ProjectSubmissionCommand(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, LessonCompletion completion, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Gated<Guid>> SubmitAsync(Guid lessonId, SubmitProjectRequest request, CancellationToken cancellationToken = default)
    {
        if (await progress.LessonAsync(lessonId, cancellationToken) is not { } found || found.Lesson.Lesson.Kind != LessonKind.Project)
        {
            return Gated<Guid>.NotFound();
        }
        var status = found.Lesson;
        if (status.Locked)
        {
            return Gated<Guid>.Locked(status.UnlockAfter);
        }
        var code = request.Code ?? string.Empty;
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        var errors = new Dictionary<string, string>();
        if (code.Trim().Length == 0)
        {
            errors["code"] = "Write some code before you submit.";
        }
        else if (code.Length > Lesson.MaximumCode)
        {
            errors["code"] = "Keep your code under 50,000 characters.";
        }
        if (note is { Length: > ProjectSubmission.MaximumNote })
        {
            errors["note"] = "Keep the note under 1,000 characters.";
        }
        if (errors.Count > 0)
        {
            return Gated<Guid>.Invalid(errors);
        }
        if (await db.ProjectSubmissions.AnyAsync(p => p.MembershipId == tenant.MembershipId && p.LessonId == lessonId, cancellationToken))
        {
            return new Gated<Guid>(ResultStatus.Conflict);
        }
        var submission = new ProjectSubmission(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, lessonId, code, note, clock.GetUtcNow());
        db.ProjectSubmissions.Add(submission);
        audit.Record(new AuditEvent(AuditAction.Created, "ProjectSubmission", submission.Id, $"{status.Lesson.Title} submitted by {tenant.ActorName}"));
        await db.SaveChangesAsync(cancellationToken);
        await completion.RecordAsync(status.Lesson, cancellationToken);
        return Gated<Guid>.Found(submission.Id);
    }
}
