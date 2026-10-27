namespace PromiseHub.Domain.Learning;

/// <summary>
/// Where a submission is (L2-078, ADR 0056): Submitted (and after every resubmission), InReview once the mentor starts, NeedsRevision when
/// the mentor asks for changes, Accepted when the mentor accepts it. Project submissions use Submitted only until mentor review arrives.
/// </summary>
public enum SubmissionStatus
{
    Submitted,
    InReview,
    NeedsRevision,
    Accepted,
}
