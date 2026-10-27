namespace PromiseHub.Application.Learning;

/// <summary>A lesson named as the next one, with its kind so the page knows where it opens.</summary>
public sealed record LessonRefDto(Guid Id, string Title, string Kind);
