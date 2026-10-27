namespace PromiseHub.Application.Learning;

/// <summary>One step of a submission's history: Submitted, ReviewStarted, RevisionRequested, Resubmitted or Accepted, who, any note and when.</summary>
public sealed record SubmissionEventDto(string Kind, string Actor, string? Note, DateTimeOffset At);
