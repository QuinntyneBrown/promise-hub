using PromiseHub.Domain.Organizations;

namespace PromiseHub.Domain.Learning;

/// <summary>
/// One youth membership's work for one assignment (L2-077, L2-078, ADR 0056): her reflection, link and at most one stored file, whether it
/// was late, its status and round, and the mentor's feedback and points. Read only to her except when a revision is asked for.
/// Every change returns the history step it makes and advances <see cref="Version"/>, the concurrency token a grade is checked against
/// (L2-083, ADR 0057).
/// </summary>
public sealed class AssignmentSubmission : ITenantOwned
{
    public const int MaximumText = 5000;
    public const int MaximumLink = 500;
    public const int MaximumFeedback = 2000;
    public const long MaximumFileBytes = 10 * 1024 * 1024;

    public AssignmentSubmission(Guid id, Guid organizationId, Guid membershipId, Guid assignmentId, string? text, string? link, bool late, DateTimeOffset submittedAt)
    {
        Id = id;
        OrganizationId = organizationId;
        MembershipId = membershipId;
        AssignmentId = assignmentId;
        Text = text;
        Link = link;
        Late = late;
        SubmittedAt = submittedAt;
        Status = SubmissionStatus.Submitted;
        Round = 1;
        Version = 1;
    }

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid MembershipId { get; private set; }
    public Guid AssignmentId { get; private set; }
    public string? Text { get; private set; }
    public string? Link { get; private set; }

    /// <summary>The file's name as she chose it; never used to store it.</summary>
    public string? FileName { get; private set; }
    public SubmissionFileKind? FileKind { get; private set; }
    public string? FileType { get; private set; }
    public long? FileBytes { get; private set; }

    /// <summary>Where file storage keeps it: submissions/{organization}/{submission}/{generated}{extension}.</summary>
    public string? FileKey { get; private set; }

    /// <summary>Sent after the due date plus the grace days.</summary>
    public bool Late { get; private set; }
    public SubmissionStatus Status { get; private set; }

    /// <summary>1 for the first submission, one more for every resubmission.</summary>
    public int Round { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }

    /// <summary>The mentor's latest note, and who wrote it.</summary>
    public string? Feedback { get; private set; }
    public string? ReviewerName { get; private set; }

    /// <summary>Points awarded of the assignment's total, once accepted.</summary>
    public int? Points { get; private set; }

    /// <summary>The mentor's scores per rubric criterion as JSON ({"criterionId": points}), draft or final; never shown to the youth.</summary>
    public string? Scores { get; private set; }

    /// <summary>The mentor's comment as last saved on the grade page; the youth sees it only as <see cref="Feedback"/> once graded.</summary>
    public string? ReviewComment { get; private set; }

    /// <summary>Advanced by every change; a grade names the version it was read at (L2-083).</summary>
    public int Version { get; private set; }

    public void AttachFile(string name, SubmissionFileKind kind, string contentType, long bytes, string key)
    {
        FileName = name;
        FileKind = kind;
        FileType = contentType;
        FileBytes = bytes;
        FileKey = key;
    }

    public void RemoveFile()
    {
        FileName = null;
        FileKind = null;
        FileType = null;
        FileBytes = null;
        FileKey = null;
    }

    public SubmissionEvent Submitted(string actorName) =>
        new(Guid.NewGuid(), OrganizationId, Id, SubmissionEventKind.Submitted, actorName, null, SubmittedAt);

    /// <summary>Replaces the work of a submission sent back for revision and returns it to Submitted.</summary>
    public SubmissionEvent Resubmit(string? text, string? link, DateTimeOffset at, string actorName)
    {
        if (Status != SubmissionStatus.NeedsRevision)
        {
            throw new InvalidOperationException("Only a submission that needs revision can be resubmitted.");
        }
        Text = text;
        Link = link;
        Round++;
        SubmittedAt = at;
        Status = SubmissionStatus.Submitted;
        Version++;
        return new(Guid.NewGuid(), OrganizationId, Id, SubmissionEventKind.Resubmitted, actorName, null, at);
    }

    /// <summary>The mentor keeps scores and a comment without changing anything the youth sees (L2-080 criterion 3).</summary>
    public void SaveDraftGrade(string? scores, string? comment)
    {
        Scores = scores;
        ReviewComment = comment;
        Version++;
    }

    /// <summary>The mentor opens it for the first time (L2-080 criterion 2).</summary>
    public SubmissionEvent StartReview(string mentorName, DateTimeOffset at)
    {
        Status = SubmissionStatus.InReview;
        ReviewerName = mentorName;
        Version++;
        return new(Guid.NewGuid(), OrganizationId, Id, SubmissionEventKind.ReviewStarted, mentorName, null, at);
    }

    /// <summary>The mentor sends it back with a note (L2-080 criterion 5).</summary>
    public SubmissionEvent RequestRevision(string note, string mentorName, DateTimeOffset at)
    {
        Status = SubmissionStatus.NeedsRevision;
        Version++;
        Feedback = note;
        ReviewerName = mentorName;
        return new(Guid.NewGuid(), OrganizationId, Id, SubmissionEventKind.RevisionRequested, mentorName, note, at);
    }

    /// <summary>The mentor accepts it with the points awarded and a comment (L2-080 criterion 4).</summary>
    public SubmissionEvent Accept(int points, string? note, string mentorName, DateTimeOffset at)
    {
        Status = SubmissionStatus.Accepted;
        Version++;
        Points = points;
        Feedback = note;
        ReviewerName = mentorName;
        return new(Guid.NewGuid(), OrganizationId, Id, SubmissionEventKind.Accepted, mentorName, note, at);
    }
}
