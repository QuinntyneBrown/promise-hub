namespace PromiseHub.Application.Learning;

/// <summary>A module as a youth sees it (L2-068 criterion 4) with its published quizzes (L2-075 criterion 2) and assignments (L2-077 criterion 1).</summary>
public sealed record ModuleViewDto(
    Guid Id,
    string Title,
    string? Description,
    string? Anchor,
    Guid TrackId,
    string TrackName,
    int Position,
    int ModuleCount,
    int CompletedLessons,
    string Status,
    IReadOnlyList<LessonItemDto> Lessons,
    IReadOnlyList<QuizItemDto> Quizzes,
    IReadOnlyList<AssignmentItemDto> Assignments);
