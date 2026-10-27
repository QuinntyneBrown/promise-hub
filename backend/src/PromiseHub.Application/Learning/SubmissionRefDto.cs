namespace PromiseHub.Application.Learning;

/// <summary>The youth's submission of an assignment, by id and status.</summary>
public sealed record SubmissionRefDto(Guid Id, string Status);
