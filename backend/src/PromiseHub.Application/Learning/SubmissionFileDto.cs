namespace PromiseHub.Application.Learning;

/// <summary>The file a youth sent: its name as she chose it, Photo or File, and its size.</summary>
public sealed record SubmissionFileDto(string Name, string Kind, long Bytes);
