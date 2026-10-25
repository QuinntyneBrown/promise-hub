namespace PromiseHub.Application.Enrollment;

public sealed record BulkReviewCommand(Guid[]? Ids, ReviewDecision Decision, string? Note);
