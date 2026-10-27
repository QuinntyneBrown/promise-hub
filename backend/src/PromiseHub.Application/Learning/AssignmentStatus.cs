using PromiseHub.Domain.Curriculum;

namespace PromiseHub.Application.Learning;

/// <summary>
/// One published assignment of a visible module as a youth stands with it (L2-077 criteria 1 and 2, ADR 0056): locked with what to finish
/// first, and her submission when she has sent one.
/// </summary>
public sealed record AssignmentStatus(Assignment Assignment, bool Locked, string? UnlockAfter, Guid? SubmissionId, string? SubmissionStatus)
{
    /// <summary>locked, next, or her submission's status in lower case with dashes (submitted, in-review, needs-revision, accepted).</summary>
    public string State => Locked ? "locked" : SubmissionStatus switch
    {
        null => "next",
        "InReview" => "in-review",
        "NeedsRevision" => "needs-revision",
        { } other => other.ToLowerInvariant(),
    };
}
