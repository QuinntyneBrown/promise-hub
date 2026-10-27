using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Learning;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// A submission of one of the mentor's youth (L2-080 criteria 2 and 7, ADR 0057): anything else is not found. The first open of a Submitted
/// submission starts the review, with its history step, audited as Updated; later reads change nothing.
/// </summary>
public sealed class SubmissionReviewHandler(IPromiseHubDb db, ITenantContext tenant, MentorYouthMemberships youth, IFileStore files, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Gated<SubmissionReviewDto>> HandleAsync(Guid submissionId, CancellationToken cancellationToken = default)
    {
        var names = await youth.ReadAsync(cancellationToken);
        var submission = await db.AssignmentSubmissions.FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);
        if (submission is null || !names.TryGetValue(submission.MembershipId, out var youthName))
        {
            return Gated<SubmissionReviewDto>.NotFound();
        }
        var assignment = await db.Assignments.AsNoTracking().FirstAsync(a => a.Id == submission.AssignmentId, cancellationToken);
        if (submission.Status == SubmissionStatus.Submitted)
        {
            db.SubmissionEvents.Add(submission.StartReview(tenant.ActorName, clock.GetUtcNow()));
            audit.Record(new AuditEvent(AuditAction.Updated, "AssignmentSubmission", submission.Id, $"{assignment.Title} · review started by {tenant.ActorName}"));
            await db.SaveChangesAsync(cancellationToken);
        }
        var module = await db.CurriculumModules.AsNoTracking().Where(m => m.Id == assignment.ModuleId).Select(m => m.Title).FirstAsync(cancellationToken);
        var scores = Parse(submission.Scores);
        var rubric = (await db.RubricCriteria.AsNoTracking().Where(c => c.AssignmentId == assignment.Id).ToListAsync(cancellationToken))
            .OrderBy(c => c.Position)
            .Select(c => new RubricScoreDto(c.Id, c.Description, c.Points, scores.TryGetValue(c.Id, out var p) ? p : null))
            .ToList();
        var history = await db.SubmissionEvents.AsNoTracking().Where(e => e.SubmissionId == submission.Id).ToListAsync(cancellationToken);
        return Gated<SubmissionReviewDto>.Found(new SubmissionReviewDto(submission.Id, submission.MembershipId, youthName, assignment.Id, assignment.Title, module,
            assignment.Brief, submission.Status.ToString(), submission.Late, submission.Round, submission.SubmittedAt, submission.Text, submission.Link,
            submission.FileName is { } name ? new SubmissionFileDto(name, submission.FileKind!.Value.ToString(), submission.FileBytes ?? 0) : null,
            rubric, assignment.TotalPoints, submission.ReviewComment, submission.Feedback, submission.Points,
            [.. history.OrderBy(e => e.At).Select(e => new SubmissionEventDto(e.Kind.ToString(), e.ActorName, e.Note, e.At))], submission.Version));
    }

    public async Task<Gated<SubmissionFileStream>> FileAsync(Guid submissionId, CancellationToken cancellationToken = default)
    {
        var names = await youth.ReadAsync(cancellationToken);
        var submission = await db.AssignmentSubmissions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);
        if (submission?.FileKey is not { } key || !names.ContainsKey(submission.MembershipId) || await files.OpenReadAsync(key, cancellationToken) is not { } content)
        {
            return Gated<SubmissionFileStream>.NotFound();
        }
        return Gated<SubmissionFileStream>.Found(new SubmissionFileStream(content, submission.FileType!, submission.FileName!));
    }

    /// <summary>The saved scores by criterion; nothing when none are saved.</summary>
    public static IReadOnlyDictionary<Guid, int> Parse(string? scores) =>
        string.IsNullOrEmpty(scores) ? new Dictionary<Guid, int>() : JsonSerializer.Deserialize<Dictionary<Guid, int>>(scores) ?? [];
}
