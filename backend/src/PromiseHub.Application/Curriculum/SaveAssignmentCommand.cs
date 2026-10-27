namespace PromiseHub.Application.Curriculum;

/// <summary>Everything the assignment builder saves at once, the whole rubric included (L2-074 criteria 2 to 4).</summary>
public sealed record SaveAssignmentCommand(
    string? Title,
    Guid? LessonId,
    string? Brief,
    IReadOnlyList<string>? SubmissionTypes,
    IReadOnlyList<RubricInput>? Rubric,
    DateOnly? DueDate,
    int GraceDays,
    bool AllowLate,
    bool RequireApproval);
