using Microsoft.EntityFrameworkCore;
using PromiseHub.Application.Audit;
using PromiseHub.Application.Curriculum;
using PromiseHub.Application.Organizations;
using PromiseHub.Domain.Audit;
using PromiseHub.Domain.Curriculum;
using PromiseHub.Domain.Learning;

namespace PromiseHub.Application.Learning;

/// <summary>
/// Submits a youth's work for a visible, unlocked assignment (L2-077 criteria 3 to 5, ADR 0056): once, with the attestation and at least
/// one allowed kind of work, a file checked by <see cref="SubmissionFilePolicy"/> and stored through file storage, marked late after the
/// due date plus grace and refused once closed. Audited as Submitted without the text.
/// </summary>
public sealed class SubmissionCommand(IPromiseHubDb db, ITenantContext tenant, LearnerProgress progress, IFileStore files, IAuditWriter audit, TimeProvider clock)
{
    public async Task<Gated<Guid>> SubmitAsync(Guid assignmentId, SubmissionWork work, CancellationToken cancellationToken = default)
    {
        if (await progress.AssignmentAsync(assignmentId, cancellationToken) is not { } found)
        {
            return Gated<Guid>.NotFound();
        }
        var status = found.Assignment;
        if (status.Locked)
        {
            return Gated<Guid>.Locked(status.UnlockAfter);
        }
        if (status.SubmissionId is not null)
        {
            return Gated<Guid>.Conflict("submitted");
        }
        var assignment = status.Assignment;
        var now = clock.GetUtcNow();
        var due = DueRules.State(assignment, DateOnly.FromDateTime(now.UtcDateTime));
        if (due == DueRules.Closed)
        {
            return Gated<Guid>.Conflict("closed");
        }
        var (text, link, errors) = Check(assignment.SubmissionTypes, work, keepsFile: false);
        var head = new byte[16];
        var read = 0;
        (SubmissionFileKind Kind, string ContentType, string Extension)? accepted = null;
        if (work.File is { } file && !errors.ContainsKey("file"))
        {
            read = await file.Content.ReadAtLeastAsync(head, head.Length, throwOnEndOfStream: false, cancellationToken);
            accepted = SubmissionFilePolicy.Accept(file.FileName, file.ContentType, file.Length, head.AsSpan(0, read), assignment.SubmissionTypes);
            if (accepted is null)
            {
                errors["file"] = SubmissionFilePolicy.Refusal(assignment.SubmissionTypes);
            }
        }
        if (errors.Count > 0)
        {
            return Gated<Guid>.Invalid(errors);
        }
        var submission = new AssignmentSubmission(Guid.NewGuid(), tenant.OrganizationId, tenant.MembershipId, assignment.Id, text, link, due == DueRules.Late, now);
        if (accepted is { } a)
        {
            var key = $"submissions/{tenant.OrganizationId}/{submission.Id}/{Guid.NewGuid():N}{a.Extension}";
            await files.SaveAsync(key, new HeadStream(head.AsMemory(0, read), work.File!.Content), cancellationToken);
            submission.AttachFile(Path.GetFileName(work.File.FileName), a.Kind, a.ContentType, work.File.Length, key);
        }
        db.AssignmentSubmissions.Add(submission);
        db.SubmissionEvents.Add(submission.Submitted(tenant.ActorName));
        audit.Record(new AuditEvent(AuditAction.Submitted, "AssignmentSubmission", submission.Id, $"{assignment.Title} submitted by {tenant.ActorName}",
            After: new { submission.Late, File = submission.FileName }));
        await db.SaveChangesAsync(cancellationToken);
        return Gated<Guid>.Found(submission.Id);
    }

    /// <summary>The attestation, the allowed kinds of work and their limits; the file's own checks come after.</summary>
    internal static (string? Text, string? Link, Dictionary<string, string> Errors) Check(SubmissionTypes types, SubmissionWork work, bool keepsFile)
    {
        var errors = new Dictionary<string, string>();
        var text = string.IsNullOrWhiteSpace(work.Text) ? null : work.Text.Trim();
        var link = string.IsNullOrWhiteSpace(work.Link) ? null : work.Link.Trim();
        if (!work.Attest)
        {
            errors["attest"] = "Confirm this is your own work.";
        }
        if (text is not null && !types.HasFlag(SubmissionTypes.Text))
        {
            errors["text"] = "This assignment doesn’t take a reflection.";
        }
        else if (text is { Length: > AssignmentSubmission.MaximumText })
        {
            errors["text"] = "Keep your reflection under 5,000 characters.";
        }
        if (link is not null && !types.HasFlag(SubmissionTypes.Link))
        {
            errors["link"] = "This assignment doesn’t take a link.";
        }
        else if (link is { Length: > AssignmentSubmission.MaximumLink })
        {
            errors["link"] = "Keep the link under 500 characters.";
        }
        else if (link is not null && (!Uri.TryCreate(link, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")))
        {
            errors["link"] = "Enter a full web address starting with http:// or https://.";
        }
        if (work.File is not null && !SubmissionFilePolicy.TakesFiles(types))
        {
            errors["file"] = "This assignment doesn’t take a file.";
        }
        if (text is null && link is null && work.File is null && !keepsFile)
        {
            if (types.HasFlag(SubmissionTypes.Text))
            {
                errors.TryAdd("text", "Write your reflection.");
            }
            else if (types.HasFlag(SubmissionTypes.Photo))
            {
                errors.TryAdd("file", "Add your photo.");
            }
            else if (types.HasFlag(SubmissionTypes.File))
            {
                errors.TryAdd("file", "Add your file.");
            }
            else
            {
                errors.TryAdd("link", "Add your link.");
            }
        }
        return (text, link, errors);
    }
}
