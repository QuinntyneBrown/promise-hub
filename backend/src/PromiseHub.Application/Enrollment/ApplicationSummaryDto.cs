namespace PromiseHub.Application.Enrollment;

/// <summary>One application in the pipeline (screen: applications): the young person, who applied, the program and the decision so far.</summary>
public sealed record ApplicationSummaryDto(
    Guid Id,
    Guid ChildId,
    string Child,
    int? Age,
    string AppliedAs,
    string AppliedBy,
    string? ReferrerRole,
    Guid ProgramId,
    string Program,
    DateTimeOffset SubmittedAt,
    string Status,
    int? Position,
    bool SeasonConsent,
    bool Returning,
    string? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    string? Note);
