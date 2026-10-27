namespace PromiseHub.Application.Learning;

/// <summary>The youth's project submission as they see it.</summary>
public sealed record SubmissionDto(string Status, DateTimeOffset SubmittedAt, string? Note);
