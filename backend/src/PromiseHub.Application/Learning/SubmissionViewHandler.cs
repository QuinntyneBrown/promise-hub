using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Organizations;

namespace PromiseHub.Application.Learning;

/// <summary>
/// The caller's own submission and its file (L2-078 criteria 1 and 5, L2-077 criterion 4). Another youth's, another organization's or one
/// whose assignment she can no longer see is not found.
/// </summary>
public sealed class SubmissionViewHandler(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, YouthMentorName mentor, IFileStore files)
{
    public async Task<Gated<SubmissionViewDto>> HandleAsync(Guid submissionId, CancellationToken cancellationToken = default)
    {
        var submission = await db.AssignmentSubmissions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == submissionId && s.MembershipId == tenant.MembershipId, cancellationToken);
        if (submission is null || await progress.AssignmentAsync(submission.AssignmentId, cancellationToken) is not { } found)
        {
            return Gated<SubmissionViewDto>.NotFound();
        }
        var (track, module, status) = found;
        var history = await db.SubmissionEvents.AsNoTracking().Where(e => e.SubmissionId == submission.Id).ToListAsync(cancellationToken);
        return Gated<SubmissionViewDto>.Found(new SubmissionViewDto(submission.Id, submission.AssignmentId, status.Assignment.Title, module.Module.Id, module.Module.Title,
            submission.Status.ToString(), submission.Late, submission.Round, submission.Text, submission.Link,
            submission.FileName is { } name ? new SubmissionFileDto(name, submission.FileKind!.Value.ToString(), submission.FileBytes ?? 0) : null,
            submission.Feedback, submission.ReviewerName, await mentor.FindAsync(track.Track.Id, cancellationToken), submission.Points, status.Assignment.TotalPoints, submission.SubmittedAt,
            history.OrderBy(e => e.At).Select(e => new SubmissionEventDto(e.Kind.ToString(), e.ActorName, e.Note, e.At)).ToList()));
    }

    public async Task<Gated<SubmissionFileStream>> FileAsync(Guid submissionId, CancellationToken cancellationToken = default)
    {
        var submission = await db.AssignmentSubmissions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == submissionId && s.MembershipId == tenant.MembershipId, cancellationToken);
        if (submission?.FileKey is not { } key || await progress.AssignmentAsync(submission.AssignmentId, cancellationToken) is null
            || await files.OpenReadAsync(key, cancellationToken) is not { } content)
        {
            return Gated<SubmissionFileStream>.NotFound();
        }
        return Gated<SubmissionFileStream>.Found(new SubmissionFileStream(content, submission.FileType!, submission.FileName!));
    }
}
