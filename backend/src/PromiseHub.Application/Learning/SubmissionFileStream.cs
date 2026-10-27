namespace PromiseHub.Application.Learning;

/// <summary>A stored submission file opened for its owner.</summary>
public sealed record SubmissionFileStream(Stream Content, string ContentType, string FileName);
