using PromiseHub.Application.Learning;

namespace PromiseHub.Application.Mentoring;

/// <summary>
/// A submission as its mentor grades it (L2-080 criterion 2): the youth, assignment and task, what she sent, the rubric with saved scores,
/// the saved comment, the history and the version a grade is checked against (L2-083).
/// </summary>
public sealed record SubmissionReviewDto(
    Guid Id,
    Guid MembershipId,
    string YouthName,
    Guid AssignmentId,
    string AssignmentTitle,
    string ModuleTitle,
    string? Brief,
    string Status,
    bool Late,
    int Round,
    DateTimeOffset SubmittedAt,
    string? Text,
    string? Link,
    SubmissionFileDto? File,
    IReadOnlyList<RubricScoreDto> Rubric,
    int TotalPoints,
    string? Comment,
    string? Feedback,
    int? Points,
    IReadOnlyList<SubmissionEventDto> History,
    int Version);
