namespace PromiseHub.Application.Learning;

/// <summary>A module in a track: <see cref="Status"/> is done, in-progress, not-started or locked; <see cref="UnlockAfter"/> names the prerequisite while locked.</summary>
public sealed record ModuleItemDto(Guid Id, string Title, string? Description, int LessonCount, int CompletedLessons, string Status, string? UnlockAfter);
