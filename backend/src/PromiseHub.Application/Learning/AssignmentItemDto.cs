namespace PromiseHub.Application.Learning;

/// <summary>
/// An assignment on a module page (L2-077 criterion 1): <see cref="Status"/> is locked, next, submitted, in-review, needs-revision or
/// accepted; <see cref="SubmissionId"/> is her submission once sent; <see cref="UnlockAfter"/> names what to finish while locked.
/// </summary>
public sealed record AssignmentItemDto(Guid Id, string Title, Guid? LessonId, int TotalPoints, DateOnly? DueDate, string Status, string? UnlockAfter, Guid? SubmissionId);
