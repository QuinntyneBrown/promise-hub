namespace PromiseHub.Application.Learning;

/// <summary>
/// An assignment as a youth reads it before submitting (L2-077 criterion 1): the task, ways to submit, rubric, due rules with today's
/// state (open, late or closed) and days left, her mentor and her submission. Mentor-only notes are never included.
/// </summary>
public sealed record AssignmentBriefDto(
    Guid Id,
    string Title,
    Guid ModuleId,
    string ModuleTitle,
    string? LessonTitle,
    string Brief,
    IReadOnlyList<string> SubmissionTypes,
    IReadOnlyList<RubricLineDto> Rubric,
    int TotalPoints,
    DateOnly? DueDate,
    int GraceDays,
    bool AllowLate,
    string DueState,
    int? DaysLeft,
    string? MentorName,
    SubmissionRefDto? Submission);
