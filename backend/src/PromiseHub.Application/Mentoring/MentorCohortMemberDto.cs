namespace PromiseHub.Application.Mentoring;

/// <summary>A youth on a cohort's active roster, for a mentor on its team: age and their own mentor, or none.</summary>
public sealed record MentorCohortMemberDto(Guid Id, string Name, int? Age, string? Mentor);
