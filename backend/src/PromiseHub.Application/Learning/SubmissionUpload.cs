namespace PromiseHub.Application.Learning;

/// <summary>A file sent with a submission: the name and type the browser gave, its length and its content.</summary>
public sealed record SubmissionUpload(string FileName, string? ContentType, long Length, Stream Content);
