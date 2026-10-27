using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Learning;
using PromiseHub.Domain.Notifications;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// Grades a submission of one of the mentor's youth (L2-080 criteria 3 to 7, L2-083, ADR 0057). The version comes first (409 stale), then
/// the status (409 not-reviewable once Accepted or Needs revision), then each score against its criterion. A draft keeps the scores and
/// comment; approve accepts it with the total; revise sends it back with the note. Approve and revise notify the youth. The change, its
/// history step, the notification and the audit entry are one save; a race past the version check is answered stale too.
/// </summary>
public sealed class GradeSubmissionHandler(IPromiseHubDb db, ITenantContext tenant, MentorYouthMemberships youth, IAuditWriter audit, TimeProvider clock, BadgeAwarder badges)
{
    public async Task<Gated<GradeOutcomeDto>> HandleAsync(Guid submissionId, GradeRequest request, CancellationToken cancellationToken = default)
    {
        var names = await youth.ReadAsync(cancellationToken);
        var submission = await db.AssignmentSubmissions.FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);
        if (submission is null || !names.ContainsKey(submission.MembershipId))
        {
            return Gated<GradeOutcomeDto>.NotFound();
        }
        if (submission.Version != request.Version)
        {
            return Gated<GradeOutcomeDto>.Conflict("stale");
        }
        if (submission.Status is SubmissionStatus.Accepted or SubmissionStatus.NeedsRevision)
        {
            return Gated<GradeOutcomeDto>.Conflict("not-reviewable");
        }
        var decision = request.Decision;
        var comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim();
        var criteria = (await db.RubricCriteria.AsNoTracking().Where(c => c.AssignmentId == submission.AssignmentId).ToListAsync(cancellationToken))
            .OrderBy(c => c.Position).ToList();
        var given = (request.Scores ?? []).GroupBy(s => s.CriterionId).ToDictionary(g => g.Key, g => g.Last().Points);
        var errors = new Dictionary<string, string>();
        if (decision is not ("draft" or "approve" or "revise"))
        {
            errors["decision"] = "Choose draft, approve or revise.";
        }
        if (given.Keys.Any(id => criteria.All(c => c.Id != id)))
        {
            errors["scores"] = "Score only this assignment’s criteria.";
        }
        for (var i = 0; i < criteria.Count; i++)
        {
            var c = criteria[i];
            if (given.TryGetValue(c.Id, out var points) && (points < 0 || points > c.Points))
            {
                errors[$"scores.{i}"] = $"Give 0 to {c.Points} points.";
            }
            else if (decision == "approve" && !given.ContainsKey(c.Id))
            {
                errors[$"scores.{i}"] = "Score this criterion before you approve.";
            }
        }
        if (comment?.Length > AssignmentSubmission.MaximumFeedback)
        {
            errors["comment"] = "Keep the comment to 2,000 characters.";
        }
        else if (decision == "revise" && comment is null)
        {
            errors["comment"] = "Write what they should change.";
        }
        if (errors.Count > 0)
        {
            return Gated<GradeOutcomeDto>.Invalid(errors);
        }
        var assignment = await db.Assignments.AsNoTracking().FirstAsync(a => a.Id == submission.AssignmentId, cancellationToken);
        var now = clock.GetUtcNow();
        submission.SaveDraftGrade(given.Count == 0 ? null : JsonSerializer.Serialize(given), comment);
        var total = given.Values.Sum();
        var summary = $"{assignment.Title} · draft grade saved by {tenant.ActorName}";
        if (decision == "approve")
        {
            db.SubmissionEvents.Add(submission.Accept(total, comment, tenant.ActorName, now));
            Notify(submission, $"{tenant.ActorName} approved {assignment.Title}: {total} of {assignment.TotalPoints} points.", now);
            summary = $"{assignment.Title} · approved by {tenant.ActorName}, {total} of {assignment.TotalPoints} points";
        }
        else if (decision == "revise")
        {
            db.SubmissionEvents.Add(submission.RequestRevision(comment!, tenant.ActorName, now));
            Notify(submission, $"{tenant.ActorName} asked for a revision of {assignment.Title}.", now);
            summary = $"{assignment.Title} · sent back for revision by {tenant.ActorName}";
        }
        audit.Record(new AuditEvent(AuditAction.Updated, "AssignmentSubmission", submission.Id, summary,
            After: new { Status = submission.Status.ToString(), submission.Points, Scored = given.Count }));
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Gated<GradeOutcomeDto>.Conflict("stale");
        }
        if (decision == "approve")
        {
            await badges.AwardAsync(submission.MembershipId, cancellationToken);
        }
        return Gated<GradeOutcomeDto>.Found(new GradeOutcomeDto(submission.Status.ToString(), submission.Points, submission.Version));
    }

    private void Notify(AssignmentSubmission submission, string text, DateTimeOffset now) =>
        db.Notifications.Add(new Notification(Guid.NewGuid(), tenant.OrganizationId, submission.MembershipId, "learning", text, $"/learning/submissions/{submission.Id}", now));
}
