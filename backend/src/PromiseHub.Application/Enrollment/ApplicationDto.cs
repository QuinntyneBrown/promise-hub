namespace PromiseHub.Application.Enrollment;

/// <summary>One application (screen: application): the young person, who applied and why, the family, the decision and the staff notes.</summary>
public sealed record ApplicationDto(
    Guid Id,
    Guid ChildId,
    string Child,
    string FirstName,
    DateOnly? DateOfBirth,
    int? Age,
    Guid HouseholdId,
    string Household,
    bool Returning,
    ApplicationGuardianDto? Guardian,
    string AppliedAs,
    string AppliedBy,
    string? Reason,
    ApplicationReferrerDto? Referrer,
    Guid ProgramId,
    string Program,
    DateTimeOffset SubmittedAt,
    string Status,
    int? Position,
    bool SeasonConsent,
    string? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    string? Note,
    IReadOnlyList<ApplicationNoteDto> Notes);
