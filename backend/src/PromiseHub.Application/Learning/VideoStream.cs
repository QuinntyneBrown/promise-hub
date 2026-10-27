namespace PromiseHub.Application.Learning;

/// <summary>A lesson's stored video, opened for streaming.</summary>
public sealed record VideoStream(Stream Content, string ContentType);
