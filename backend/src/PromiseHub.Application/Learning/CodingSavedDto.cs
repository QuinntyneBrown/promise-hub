namespace PromiseHub.Application.Learning;

/// <summary>After saving coding progress: ticks out of steps, whether the lesson is done, and what comes next once it is.</summary>
public sealed record CodingSavedDto(int Checked, int Total, bool Done, Guid? NextLessonId, string? NextLessonTitle, string? NextLessonKind, bool ModuleCompleted);
