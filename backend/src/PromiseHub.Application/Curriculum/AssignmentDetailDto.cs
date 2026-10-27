namespace PromiseHub.Application.Curriculum;

/// <summary>One assignment for the assignment builder (L2-074): every field, the rubric in order, the lessons it can be attached to and who will see it.</summary>
public sealed record AssignmentDetailDto(
    Guid Id,
    Guid ModuleId,
    string ModuleTitle,
    Guid TrackId,
    string TrackName,
    string Title,
    Guid? LessonId,
    string Status,
    string? Brief,
    IReadOnlyList<string> SubmissionTypes,
    IReadOnlyList<RubricCriterionDto> Rubric,
    int TotalPoints,
    DateOnly? DueDate,
    int GraceDays,
    bool AllowLate,
    bool RequireApproval,
    IReadOnlyList<LessonOptionDto> Lessons,
    IReadOnlyList<string> Programs);
