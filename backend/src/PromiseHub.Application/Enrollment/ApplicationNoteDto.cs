namespace PromiseHub.Application.Enrollment;

/// <summary>A staff note on an application.</summary>
public sealed record ApplicationNoteDto(Guid Id, string Author, string Text, DateTimeOffset CreatedAt);
