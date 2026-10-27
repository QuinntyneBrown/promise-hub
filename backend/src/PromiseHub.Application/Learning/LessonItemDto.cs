namespace PromiseHub.Application.Learning;

/// <summary>A lesson in a module: <see cref="Status"/> is done, next or locked; <see cref="UnlockAfter"/> names what to finish first.</summary>
public sealed record LessonItemDto(Guid Id, string Title, string Kind, string? Reading, int? Minutes, string Status, string? UnlockAfter);
