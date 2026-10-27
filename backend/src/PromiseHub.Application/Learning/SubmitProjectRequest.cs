namespace PromiseHub.Application.Learning;

/// <summary>The project's code and an optional note to the mentor.</summary>
public sealed record SubmitProjectRequest(string? Code, string? Note);
