namespace PromiseHub.Application.Learning;

/// <summary>
/// The caller's own submission (L2-078 criteria 1 to 3): the assignment and module, its status, whether it was late, the round, a copy of
/// what she sent, the mentor's feedback with who gave it, her mentor (who reviews it next), the points awarded of the total once accepted, and its history in order.
/// </summary>
public sealed record SubmissionViewDto(
    Guid Id,
    Guid AssignmentId,
    string AssignmentTitle,
    Guid ModuleId,
    string ModuleTitle,
    string Status,
    bool Late,
    int Round,
    string? Text,
    string? Link,
    SubmissionFileDto? File,
    string? Feedback,
    string? ReviewerName,
    string? MentorName,
    int? Points,
    int TotalPoints,
    DateTimeOffset SubmittedAt,
    IReadOnlyList<SubmissionEventDto> History);
