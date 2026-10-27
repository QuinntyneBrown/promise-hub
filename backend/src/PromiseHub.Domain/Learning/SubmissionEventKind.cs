namespace PromiseHub.Domain.Learning;

/// <summary>One step of a submission's history as the youth reads it (L2-078 criterion 1, ADR 0056).</summary>
public enum SubmissionEventKind
{
    Submitted,
    ReviewStarted,
    RevisionRequested,
    Resubmitted,
    Accepted,
}
